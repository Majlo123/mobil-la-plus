/**
 * Alt tekst fotografije artikla — opisna rečenica na srpskom, sastavljena od
 * podataka iz kataloga.
 *
 * ZAŠTO POSTOJI: alt je uz naziv fajla najjači signal Google Images-u o čemu je
 * slika, a do sada je bio golo `p.name`. Nazivi u katalogu su veleprodajni i
 * kupac ih nikad ne bi ukucao:
 *
 *   „TPU MATTE for SM-A336 (Galaxy A33 5G) zelena"
 *   „Torbica Magsafe Lux za Samsung S921B Galaxy S24 zelena"
 *
 * U njima je pola teksta šifra artikla dobavljača, a reč koju kupac zaista
 * traži („maska") ne postoji uopšte. Ovde se od istih podataka pravi:
 *
 *   „Maska za Samsung Galaxy A33 5G — TPU Matte, zelena"
 *
 * Redosled nije proizvoljan: prvo vrsta artikla u jednini, pa telefon za koji
 * je — tim redom se i pretražuje („maska za samsung a33"). Ostatak naziva ide
 * iza crte kao dopuna, jer nosi materijal i boju, a ne odlučuje o pogotku.
 *
 * ŠTA NAMERNO NIJE UNUTRA: naziv radnje i grad. „Maska za Galaxy A33 — Mobil
 * Plus LA Novi Sad" na 30.000 slika je isti rep teksta 30.000 puta, što je
 * klasičan spam signal u alt-u; ime prodavca Google čita iz strukturiranih
 * podataka i sadržaja strane, gde mu je i mesto.
 */

import { normalize } from "@/lib/catalog";
// `import type` — tip se briše pri kompajliranju, pa ovaj modul ostaje
// upotrebljiv i u komponentama koje ne smeju da povuku ceo katalog.
import type { Product } from "@/lib/products";

/**
 * Samo polja koja opis stvarno čita. Uži tip od `Product` znači da alt može da
 * se napravi i tamo gde postoji delimičan zapis artikla (npr. rezultat pretrage
 * koji ne nosi cenu).
 */
export type ArtikalZaOpis = Pick<
  Product,
  "name" | "typeKey" | "brandKey" | "brandLabel" | "modelLabel"
>;

/**
 * Vrsta artikla u JEDNINI — prva reč alt teksta.
 *
 * Kategorije u `src/lib/data.ts` su nazvane za meni („Maske i futrole"), a u
 * opisu jedne slike mora da stoji jedan artikal („Maska"). Kategorije koje
 * mešaju više stvari (audio, power bank, delovi) dobijaju natpojam koji je
 * tačan za sve u njima, umesto najčešćeg člana koji bi na ostalima lagao.
 */
const VRSTA_JEDNINA: Record<string, string> = {
  maske: "Maska",
  stakla: "Zaštitno staklo",
  punjaci: "Punjač",
  kablovi: "Kabl",
  baterije: "Baterija",
  ekrani: "Ekran",
  audio: "Audio oprema",
  powerbank: "Power bank",
  telefoni: "Telefon",
  satovi: "Pametni sat",
  memorije: "Memorijska kartica",
  delovi: "Servisni deo",
  ostalo: "Oprema",
};

/**
 * Reči iz naziva koje znače isto što i naša vrsta, pa bi se u alt-u ponovile.
 * Ostale vrste to ne traže — njihova reč je već u nazivu doslovno („Baterija",
 * „Zastitno staklo") pa je hvata poređenje sa `VRSTA_JEDNINA`.
 */
const SINONIMI_VRSTE: Record<string, string[]> = {
  maske: ["torbica", "torbice", "futrola", "maskica"],
};

/** Skraćenice koje ostaju verzalom — ostalo se iz VIKANJA vraća u normalu. */
const SKRACENICE = new Set(["OLED", "AMOLED", "HDMI"]);

/**
 * Šifre artikala dobavljača: „SM-A336", „G990B", „GH82-23496A", „EP-DN930-CWE".
 *
 * Skidaju se SAMO kad znamo za koji je telefon artikal (vidi `detaljArtikla`):
 * u toj šifri je oznaka modela, koju smo već ispisali ljudskim rečima. Kod
 * univerzalne opreme ista šara ume da bude pravi naziv proizvoda („mikrofon
 * WS900"), pa se tamo ne dira.
 */
const KOD_DOBAVLJACA =
  /\b(?:[A-Z]{2}\d{2}-[A-Z0-9]{4,}|[A-Z]{1,3}-?[A-Z]{0,2}\d{3,}[A-Z]?)(?:-[A-Z]{2,4})?\b/g;

/**
 * Boje kakve stoje na kraju naziva. Boja je jedina stvar iz repa naziva koju
 * kupac stvarno traži uz sliku („crna maska za S24"), pa se izdvaja i lepi na
 * kraj alt teksta iza zareza, gde se i čita kao odrednica.
 */
const BOJE = new Set([
  "crna", "crni", "crno", "crne", "bela", "beli", "belo", "plava", "plavi",
  "zelena", "zeleni", "crvena", "crveni", "zuta", "zuti", "roze", "roza",
  "pink", "ljubicasta", "ljubicasti", "bordo", "braon", "siva", "sivi",
  "srebrna", "srebrni", "zlatna", "zlatni", "teget", "tirkizna",
  "narandzasta", "providna", "providni", "transparent", "black", "white",
  "blue", "red", "green", "silver", "gold", "gray", "grey", "clear",
]);

/** „tamno ljubicasta", „mat crna" — pojačivač ide uz boju, ne bez nje. */
const POJACIVACI_BOJE = new Set(["tamno", "svetlo", "mat"]);

/* -------------------------------- Pomoćno ---------------------------------- */

/** Reč svedena na poređenje: bez dijakritike, bez interpunkcije, mala slova. */
const kljucReci = (rec: string) => normalize(rec).replace(/[^a-z0-9]+/g, "");

/**
 * „TPU MATTE" → „TPU Matte". Nazivi dobavljača vape verzalom jer su pisani za
 * tabelu u Excel-u; u rečenici to izgleda kao vikanje i čitač ekrana ume da ga
 * sriče slovo po slovo.
 */
const smiriVelikaSlova = (tekst: string) =>
  tekst.replace(/\b[A-Z]{4,}\b/g, (rec) =>
    SKRACENICE.has(rec) ? rec : rec[0] + rec.slice(1).toLowerCase(),
  );

/** Skraćivanje na granici reči — presečena reč u alt-u izgleda kao greška. */
function skrati(tekst: string, max: number): string {
  if (tekst.length <= max) return tekst;
  const rez = tekst.slice(0, max);
  const razmak = rez.lastIndexOf(" ");
  return (razmak > max / 2 ? rez.slice(0, razmak) : rez).replace(/[\s,.;:/–-]+$/, "");
}

/** Boja sa kraja naziva, sa pojačivačem ako ga ima („tamno ljubicasta"). */
function bojaSaKraja(naziv: string): string | undefined {
  const reci = naziv.trim().split(/\s+/);
  const poslednja = kljucReci(reci[reci.length - 1] ?? "");
  if (!BOJE.has(poslednja)) return undefined;

  const pretposlednja = kljucReci(reci[reci.length - 2] ?? "");
  return POJACIVACI_BOJE.has(pretposlednja)
    ? `${pretposlednja} ${poslednja}`
    : poslednja;
}

/**
 * „Samsung Galaxy A33 5G" — marka pa model, onako kako se izgovara i pretražuje.
 *
 * Marka se uzima kao prvi član oznake iz kataloga („Xiaomi / Redmi / Poco" →
 * „Xiaomi"): pun oblik je grana menija, a ne ime telefona. Ne dodaje se kad je
 * već u nazivu modela („Honor X8b", „Xiaomi 14 Pro"), zbog pravila da se nijedna
 * reč u alt-u ne ponavlja.
 */
function zaKojiTelefon(p: ArtikalZaOpis): string | undefined {
  const marka =
    p.brandLabel && p.brandKey && p.brandKey !== "univerzalno"
      ? p.brandLabel.split("/")[0].trim()
      : undefined;

  if (!p.modelLabel) return marka;
  if (!marka) return p.modelLabel;

  return normalize(p.modelLabel).includes(normalize(marka))
    ? p.modelLabel
    : `${marka} ${p.modelLabel}`;
}

/**
 * Ostatak naziva — ono što artikal razlikuje od drugih iste vrste za isti
 * telefon (materijal, serija, boja).
 *
 * Naziv se seče kod prvog „za"/„for" jer sve iza toga imenuje telefon, a taj
 * podatak je već ispisan ispravno i bez šifara. Ostatak se čisti od svega što
 * bi se ponovilo: reči iz vrste artikla, reči iz naziva telefona i šifara
 * dobavljača. Ako posle toga ne ostane ništa, alt je i bez repa pun opis
 * („Maska za Samsung Galaxy S24").
 *
 * Seče se SAMO kad telefon postoji: kod univerzalne opreme „za" ne najavljuje
 * model nego namenu („Alat za otvaranje", „Torba za LED lampu"), pa bi rez tu
 * pojeo ono malo opisa što artikal ima.
 */
function detaljArtikla(
  p: ArtikalZaOpis,
  vrsta: string,
  telefon: string | undefined,
): string {
  // `> 2` da naziv koji POČINJE sa „Za…" ne ostane prazan.
  const rez = telefon ? p.name.search(/\b(?:za|for)\b/i) : -1;
  let tekst = rez > 2 ? p.name.slice(0, rez) : p.name;

  if (telefon) tekst = tekst.replace(KOD_DOBAVLJACA, " ");
  // Zagrade ostaju bez sadržaja čim iz njih ispadne šifra ili naziv modela.
  tekst = tekst.replace(/[()]/g, " ");

  const izbaci = new Set(
    [
      ...vrsta.split(/\s+/),
      ...(telefon ? telefon.split(/\s+/) : []),
      ...(SINONIMI_VRSTE[p.typeKey] ?? []),
    ]
      .map(kljucReci)
      .filter(Boolean),
  );

  const reci = tekst
    .split(/\s+/)
    .filter((rec) => {
      const kljuc = kljucReci(rec);
      return kljuc.length > 0 && !izbaci.has(kljuc);
    });

  const boja = bojaSaKraja(p.name);
  // Ako je boja preživela sečenje (naziv bez „za"), skida se sa kraja pa vraća
  // iza zareza — inače bi stajala dvaput ili bez pauze pred sobom.
  if (boja) {
    const posleZareza = kljucReci(boja.split(" ").pop() ?? "");
    while (reci.length > 0 && kljucReci(reci[reci.length - 1]) === posleZareza) {
      reci.pop();
    }
  }

  // Veliko početno slovo: posle izbacivanja reči rep često počinje sredinom
  // naziva („silikonska Ultra Thin"), a u alt-u to izgleda kao odsečen tekst.
  const ociscen = smiriVelikaSlova(reci.join(" ")).trim();
  const detalj = skrati(
    ociscen ? ociscen[0].toUpperCase() + ociscen.slice(1) : "",
    52,
  );

  if (!boja) return detalj;
  return detalj ? `${detalj}, ${boja}` : boja;
}

/* --------------------------------- Alt tekst -------------------------------- */

/**
 * Opis fotografije artikla: „Maska za Samsung Galaxy A33 5G — TPU Matte, zelena".
 *
 * Za univerzalnu opremu (nema ni marke ni modela) ostaje „Vrsta — detalj", jer
 * izmišljeni telefon u alt-u je gori od izostavljenog.
 */
export function altSlike(p: ArtikalZaOpis): string {
  const vrsta = VRSTA_JEDNINA[p.typeKey] ?? "Oprema";
  const telefon = zaKojiTelefon(p);
  const detalj = detaljArtikla(p, vrsta, telefon);
  const uvod = telefon ? `${vrsta} za ${telefon}` : vrsta;

  return detalj ? `${uvod} — ${detalj}` : uvod;
}
