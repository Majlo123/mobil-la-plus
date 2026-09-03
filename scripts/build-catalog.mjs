/**
 * Generiše katalog proizvoda iz veleprodajnih kataloga.
 *
 *   node scripts/build-catalog.mjs        (ili: npm run katalog)
 *
 * Ulaz:  data/gsmexpert-harvest.json   — GSM Expert (cene u RSD, bez PDV-a)
 *        data/vipmobil-harvest.json    — Vip mobil  (cene u EUR, bez PDV-a)
 *        data/gsm3g-harvest.json       — GSM 3G     (cene u RSD, bez PDV-a)
 * Izlaz: src/data/products.json        — katalog u kolonarnom formatu
 *        data/cene-za-proveru.json     — artikli sa sumnjivom nabavnom cenom
 *        data/neklasifikovano.json     — kategorije izvora bez mapiranja
 *
 * Nabavne cene se uzimaju BEZ PDV-a — to je cena po kojoj se roba nabavlja.
 * Prodajna cena se dobija formulom iz `scripts/pricing.mjs`.
 *
 * Mapiranje kategorija, brendova i modela menjaš u `scripts/telefoni-dictionary.mjs`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { prodajnaIzEur, prodajnaIzRsd, EUR_RSD } from "./pricing.mjs";
import {
  TIPOVI,
  KATEGORIJA_TIP,
  PRESKOCI,
  TIP_PO_NAZIVU,
  BRENDOVI,
  BREND_UNIVERZALNO,
  MODEL_U_ZAGRADI,
  MODEL_KRAJ,
  MODEL_PREFIKSI,
  MODEL_SMECE,
  SUMNJIVA_CENA_EUR,
  SUMNJIVA_CENA_RSD,
} from "./telefoni-dictionary.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = resolve(root, "data");
const OUT_DIR = resolve(root, "src/data");

/* -------------------------------------------------------------------------- */
/*                                  Pomoćno                                   */
/* -------------------------------------------------------------------------- */

const normalize = (t) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l");

const citaj = (naziv) => {
  const p = resolve(DATA, naziv);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : null;
};

/**
 * Naziv iz izvora — sređen, bez ostatka koda i višestrukih razmaka.
 *
 * GSM 3G nazive isporučuje sa CSV-navodnicima: ceo naziv je u navodnicima, a
 * inč-oznaka unutra je udvojena — `"LCD za Ipad Pro 12.9""+touch screen beli"`.
 * Bez raspakivanja kupac na kartici vidi navodnike i duplo `""` umesto `12.9"`.
 */
function sredi(naziv) {
  let t = String(naziv ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*$/, "")
    .trim();

  // Ceo naziv umotan u navodnike → skini omotač pa raspakuj udvojene navodnike.
  if (t.length > 1 && t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
  t = t.replace(/""/g, '"');

  // Ostane li neparan navodnik na kraju (npr. `... 12.9"`), to je oznaka inča i
  // ostaje; višak sa početka se skida.
  return t.replace(/^"+/, "").trim();
}

/* -------------------------------------------------------------------------- */
/*                               Klasifikacija                                */
/* -------------------------------------------------------------------------- */

const neklasifikovano = new Map();
let preskoceno = 0;

/**
 * Vrsta artikla po kategoriji izvora — sa `*` fallback-om na nivou grupe.
 * Vraća `null` za kategorije sa liste za izbacivanje (vidi `PRESKOCI`).
 */
function tipZa(izvor, grupa, podgrupa) {
  const pun = `${izvor}|${grupa}|${podgrupa}`;
  if (PRESKOCI.has(pun) || PRESKOCI.has(`${izvor}|${grupa}`)) return null;

  const tacan = KATEGORIJA_TIP[pun];
  if (tacan) return tacan;
  const zvezdica = KATEGORIJA_TIP[`${izvor}|${grupa}|*`];
  if (zvezdica) return zvezdica;
  const bezPodgrupe = KATEGORIJA_TIP[`${izvor}|${grupa}`];
  if (bezPodgrupe) return bezPodgrupe;

  // Nova kategorija na izvoru — ne sme da prođe nezapaženo.
  neklasifikovano.set(pun, (neklasifikovano.get(pun) ?? 0) + 1);
  return "delovi";
}

/**
 * Kad kategorija izvora da generički `delovi`, naziv je pouzdaniji signal —
 * vidi `TIP_PO_NAZIVU`. Primenjuje se SAMO na `delovi`, pa ne može da pokvari
 * artikal koji je kategorija već tačno svrstala.
 */
function preciziraj(tip, naziv) {
  if (tip !== "delovi") return tip;
  const n = normalize(naziv);
  for (const p of TIP_PO_NAZIVU) if (p.match.test(n)) return p.tip;
  return tip;
}

/** Brend telefona za koji artikal odgovara. */
function brendZa(naziv) {
  const n = normalize(naziv);
  for (const b of BRENDOVI) {
    if (b.match.some((re) => re.test(n))) return b;
  }
  return BREND_UNIVERZALNO;
}

/** Skida boje, oznake kvaliteta i ostalo smeće sa krajeva izvučenog modela. */
function ocistiModel(raw) {
  let m = sredi(raw).replace(/[/,+\-–—]\s*$/, "");
  let promenjeno = true;
  while (promenjeno) {
    promenjeno = false;
    const n = normalize(m);
    for (const smece of MODEL_SMECE) {
      if (n.endsWith(smece)) {
        m = m.slice(0, m.length - smece.length).replace(/[\s/,+\-–—]+$/, "");
        promenjeno = true;
        break;
      }
    }
  }
  // Više varijanti („A13 4G/ A135F/ M236") — zadrži prvu, ostale su iste stvari.
  m = m.split("/")[0].trim();
  return m.length >= 3 && m.length <= 40 ? m : null;
}

/**
 * Model telefona iz naziva. Prvo zagrada (najpouzdanije), pa odsečak od
 * brend-reči do prvog razdvajača.
 *
 * Traži se SAMO kad je brend prepoznat — vidi komentar uz `MODEL_U_ZAGRADI` u
 * rečniku. Vraća `null` kad ništa nije sigurno: bolje prazno nego pogrešno,
 * jer se model prikazuje kupcu.
 */
function modelZa(naziv, brend) {
  if (brend.key === BREND_UNIVERZALNO.key) return null;

  const uZagradi = naziv.match(MODEL_U_ZAGRADI);
  if (uZagradi) {
    const m = ocistiModel(uZagradi[1]);
    if (m) return m;
  }

  // Nađi gde u nazivu počinje brend, pa uzmi od tamo do prvog razdvajača.
  const n = normalize(naziv);
  let start = -1;
  for (const re of brend.match) {
    const hit = n.match(re);
    if (hit && hit.index !== undefined && (start === -1 || hit.index < start)) start = hit.index;
  }
  if (start === -1) return null;

  const odBrenda = naziv.slice(start).replace(MODEL_PREFIKSI, "");
  const kraj = odBrenda.search(MODEL_KRAJ);
  const m = ocistiModel(kraj > 0 ? odBrenda.slice(0, kraj) : odBrenda);
  // Mora da sadrži cifru — „Samsung telefon" nije model.
  return m && /\d/.test(m) ? m : null;
}

/* -------------------------------------------------------------------------- */
/*                                   Cene                                     */
/* -------------------------------------------------------------------------- */

const zaProveru = [];

/**
 * Prodajna cena + zaštita od pogrešno unetih nabavnih cena na izvoru.
 * Vidi `SUMNJIVA_CENA_EUR` u rečniku za objašnjenje zašto ovo postoji.
 */
function cenaZa({ id, name, nabavna, valuta, izvor }) {
  if (nabavna === null || nabavna === undefined || !(nabavna > 0)) return null;

  // Prag zavisi od valute izvora — vidi `SUMNJIVA_CENA_RSD` u rečniku.
  const granica = valuta === "RSD" ? SUMNJIVA_CENA_RSD : SUMNJIVA_CENA_EUR;
  if (nabavna > granica) {
    const uEur = valuta === "RSD" ? nabavna / EUR_RSD : nabavna;
    zaProveru.push({ id, naziv: name, izvor, nabavna, valuta, uEur: +uEur.toFixed(2) });
    return null;
  }
  return valuta === "RSD" ? prodajnaIzRsd(nabavna) : prodajnaIzEur(nabavna);
}

/* -------------------------------------------------------------------------- */
/*                                  Izvori                                    */
/* -------------------------------------------------------------------------- */

/**
 * GSM Expert: `{ "<grupa>|<podgrupa>": [[id, naziv, cenaRSDbezPDV, slika], …] }`
 * Slike su timthumb linkovi, pa ostaju apsolutne na izvor.
 */
function ucitajGsmexpert() {
  const H = citaj("gsmexpert-harvest.json");
  if (!H) return [];
  const out = [];
  for (const [kljuc, rows] of Object.entries(H)) {
    const [grupa, podgrupa] = kljuc.split("|");
    const tip = tipZa("gsmexpert", grupa, podgrupa);
    if (tip === null) {
      preskoceno += rows.length;
      continue;
    }
    for (const [id, naziv, rsd, slika] of rows) {
      const name = sredi(naziv);
      if (!name) continue;
      out.push({
        id: `ge-${id}`,
        name,
        tip: preciziraj(tip, name),
        izvor: "gsmexpert",
        price: cenaZa({ id: `ge-${id}`, name, nabavna: rsd, valuta: "RSD", izvor: "gsmexpert" }),
        image: slika ? `https://gsmexpert.rs${sredi(slika)}` : null,
      });
    }
  }
  return out;
}

/**
 * Vip mobil: `{ "<putanja kategorije>": [[sku, naziv, cenaEURbezPDV, slika], …] }`
 * Jedini izvor sa cenama u EVRIMA.
 */
function ucitajVipmobil() {
  const H = citaj("vipmobil-harvest.json");
  if (!H) return [];
  const out = [];
  for (const [kategorija, rows] of Object.entries(H)) {
    const tip = tipZa("vipmobil", kategorija, undefined);
    if (tip === null) {
      preskoceno += rows.length;
      continue;
    }
    for (const [sku, naziv, eur, slika] of rows) {
      const name = sredi(naziv);
      if (!name) continue;
      out.push({
        id: `vm-${sku}`,
        name,
        tip: preciziraj(tip, name),
        izvor: "vipmobil",
        price: cenaZa({ id: `vm-${sku}`, name, nabavna: eur, valuta: "EUR", izvor: "vipmobil" }),
        image: slika ? `https://www.vipmobil.net${sredi(slika)}` : null,
      });
    }
  }
  return out;
}

/**
 * GSM 3G: `{ "<Level1>|<Level2>": [[sifra, naziv, cenaRSDbezPDV, slika], …] }`
 * Cene su u DINARIMA bez PDV-a (`Price` iz njihovog OData servisa), a slike su
 * već pune URL adrese na njihov blob storage.
 */
function ucitajGsm3g() {
  const H = citaj("gsm3g-harvest.json");
  if (!H) return [];
  const out = [];
  for (const [kljuc, rows] of Object.entries(H)) {
    const [nadgrupa, podgrupa] = kljuc.split("|");
    const tip = tipZa("gsm3g", nadgrupa, podgrupa);
    if (tip === null) {
      preskoceno += rows.length;
      continue;
    }
    for (const [sifra, naziv, rsd, slika] of rows) {
      const name = sredi(naziv);
      if (!name) continue;
      out.push({
        id: `g3-${sifra}`,
        name,
        tip: preciziraj(tip, name),
        izvor: "gsm3g",
        price: cenaZa({ id: `g3-${sifra}`, name, nabavna: rsd, valuta: "RSD", izvor: "gsm3g" }),
        image: slika ? sredi(slika) : null,
      });
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/*                                  Pakovanje                                 */
/* -------------------------------------------------------------------------- */

/**
 * Kolonarni format: tabele naziva + red po artiklu sa indeksima.
 * Bez ovoga bi se „Maske i futrole" i „Samsung" ponavljali hiljadama puta.
 */
function pack(items) {
  const types = [];
  const brands = [];
  const typeIdx = new Map();
  const brandIdx = new Map();

  const upisi = (table, idx, key, label) => {
    if (!idx.has(key)) {
      idx.set(key, table.length);
      table.push({ key, label });
    }
    return idx.get(key);
  };

  const rows = items.map((p) => {
    const brend = brendZa(p.name);
    const t = upisi(types, typeIdx, p.tip, TIPOVI[p.tip] ?? p.tip);
    const b = upisi(brands, brandIdx, brend.key, brend.label);
    return [p.id, p.name, p.price, p.image, t, b, modelZa(p.name, brend)];
  });

  return { types, brands, items: rows };
}

/* -------------------------------------------------------------------------- */
/*                                    Main                                    */
/* -------------------------------------------------------------------------- */

const svi = [...ucitajGsmexpert(), ...ucitajVipmobil(), ...ucitajGsm3g()];

// Isti artikal često postoji kod dva dobavljača — zadrži jeftiniji, jer se po
// njemu i formira naša cena. Poređenje je po normalizovanom nazivu.
const najbolji = new Map();
for (const p of svi) {
  const kljuc = normalize(p.name);
  const stari = najbolji.get(kljuc);
  if (!stari) {
    najbolji.set(kljuc, p);
    continue;
  }
  const bolji =
    stari.price === null ? p : p.price === null ? stari : p.price < stari.price ? p : stari;
  najbolji.set(kljuc, bolji);
}

const items = [...najbolji.values()].sort((a, b) => a.name.localeCompare(b.name, "sr"));
const packed = pack(items);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(resolve(OUT_DIR, "products.json"), JSON.stringify(packed));
writeFileSync(resolve(DATA, "cene-za-proveru.json"), JSON.stringify(zaProveru, null, 2));
writeFileSync(
  resolve(DATA, "neklasifikovano.json"),
  JSON.stringify(Object.fromEntries(neklasifikovano), null, 2),
);

/* -------------------------------- Izveštaj --------------------------------- */

const poIzvoru = {};
for (const p of svi) poIzvoru[p.izvor] = (poIzvoru[p.izvor] ?? 0) + 1;

const poTipu = {};
for (const p of items) poTipu[p.tip] = (poTipu[p.tip] ?? 0) + 1;

const bezCene = items.filter((p) => p.price === null).length;
const saSlikom = items.filter((p) => p.image).length;
const saModelom = packed.items.filter((r) => r[6]).length;
const pct = (n) => `${Math.round((n / items.length) * 100)}%`;

console.log("Katalog izgrađen:");
console.log(`  preskočeno (nije za telefone) : ${preskoceno}`);
console.log(`  ukupno sa izvora              : ${svi.length}`);
console.log(`  posle dedupa                  : ${items.length}  (spojeno ${svi.length - items.length})`);
console.log(`  po izvoru                     : ${JSON.stringify(poIzvoru)}`);
console.log(`  po vrsti                      : ${JSON.stringify(poTipu)}`);
console.log(`  brendova                      : ${packed.brands.length}`);
console.log(`  sa slikom                     : ${saSlikom} (${pct(saSlikom)})`);
console.log(`  sa modelom                    : ${saModelom} (${pct(saModelom)})`);
console.log(`  bez cene                      : ${bezCene}`);
console.log(`  za proveru cene               : ${zaProveru.length}  → data/cene-za-proveru.json`);
if (neklasifikovano.size) {
  console.log(`  ⚠ nemapiranih kategorija      : ${neklasifikovano.size} → data/neklasifikovano.json`);
}
