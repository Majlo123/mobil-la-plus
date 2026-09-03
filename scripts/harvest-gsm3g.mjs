/**
 * Preuzima katalog sa GSM 3G B2B portala.
 *
 *   node scripts/harvest-gsm3g.mjs      (ili: npm run gsm3g)
 *
 * Izlaz: data/gsm3g-harvest.json
 *
 * KAKO RADI: portal gsm3g.com je samo ljuska — proizvode dovlači sa zasebnog
 * OData servisa koji NE traži kolačić sesije, nego identifikuje kupca preko
 * `userUid` i `SalesPriceGroupUid` u query stringu. Zato ovo radi iz Node-a,
 * bez pretraživača (za razliku od gsmexpert.rs i vipmobil.net, gde cene vidi
 * samo ulogovana sesija).
 *
 * UID-ovi ispod su nalog Mobil Plus LA i određuju CENOVNU GRUPU — dakle i
 * nabavne cene. Ako se promeni nalog ili cenovna grupa, uzmi nove vrednosti iz
 * mrežnog zahteva `Products/Get` na gsm3g.com i zameni ih ovde.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(root, "data/gsm3g-harvest.json");

const API = "https://rstrig-api-kzczjbhb7d44s-test.azurewebsites.net/Products/Get";

const NALOG = {
  basketUid: "bec047d7-0771-4a34-8bc3-bc4f34b2ba91",
  SalesPriceGroupUid: "bec047d7-0771-4a34-8bc3-bc4f34b2ba91",
  userUid: "67a82bb0-1fbb-4a06-8b02-16c822648a0e",
};

/** Koliko artikala po zahtevu. Portal traži 52; servis podnosi znatno više. */
const TOP = 500;

/**
 * Uzimamo SAMO kategorije vezane za mobilne telefone — portal prodaje i
 * računare, auto opremu, rasvetu, kućne aparate i sport, što nije naš posao.
 * Alati ulaze jer je Mobil Plus LA servis, pa je serviserski alat u domenu.
 */
const NASE_KATEGORIJE = new Set([
  "OPREMA ZA MOBILNI TELEFON I TABLET",
  "REZERVNI DELOVI",
  "MOBILNI TELEFONI I TABLETI",
  "SMART OPREMA",
  "ALATI",
]);

const query = (skip) =>
  new URLSearchParams({
    $inlinecount: "allpages",
    $format: "json",
    ...NALOG,
    listName: "",
    ActionName: "",
    ShowOnlyMasterItems: "true",
    Log: "false",
    sImages: "1",
    returnActions: "true",
    showCategory: "true",
    filterWishListOnly: "false",
    Query: "",
    ShowRetailPrice: "false",
    fromPrice: "0",
    toPrice: "0",
    // Bez ovoga bi ulazili i artikli kojih nema — kupcu ne prikazujemo robu
    // koju dobavljač trenutno ne drži.
    filterOnlyInStock: "true",
    ShowActionItems: "false",
    $top: String(TOP),
    $skip: String(skip),
    $orderby: "Order desc",
  });

async function stranica(skip, pokusaj = 0) {
  try {
    const r = await fetch(`${API}?${query(skip)}`, {
      headers: {
        Accept: "application/json",
        Origin: "https://gsm3g.com",
        Referer: "https://gsm3g.com/",
      },
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (e) {
    // Azure zna da odbije zahtev pod opterećenjem; tri pokušaja pa odustajemo.
    if (pokusaj < 3) {
      await new Promise((res) => setTimeout(res, 1500 * (pokusaj + 1)));
      return stranica(skip, pokusaj + 1);
    }
    throw e;
  }
}

/* --------------------------------- Preuzimanje ----------------------------- */

const prva = await stranica(0);
const ukupno = prva.SalesItemsCount;
console.log(`GSM 3G: ${ukupno} artikala na lageru, ${TOP} po zahtevu`);

const svi = new Map();
const dodaj = (items) => {
  for (const it of items ?? []) {
    const kat = it.Level1GroupName ?? "";
    if (!NASE_KATEGORIJE.has(kat)) continue;
    const sifra = it.Identifier ?? it.ExternalID ?? it.UidString ?? it.Uid;
    if (!sifra || svi.has(sifra)) continue;
    svi.set(sifra, [
      String(sifra),
      String(it.Name ?? "").replace(/\s+/g, " ").trim(),
      typeof it.Price === "number" && it.Price > 0 ? it.Price : null,
      it.ImageUrl || null,
      kat,
      it.Level2GroupName ?? "",
    ]);
  }
};

dodaj(prva.SalesItems);

for (let skip = TOP; skip < ukupno; skip += TOP) {
  const j = await stranica(skip);
  dodaj(j.SalesItems);
  const pct = Math.round(((skip + TOP) / ukupno) * 100);
  process.stdout.write(`\r  preuzeto ${Math.min(skip + TOP, ukupno)}/${ukupno} (${pct}%) — zadržano ${svi.size}   `);
}
process.stdout.write("\n");

/* ---------------------------------- Upis ----------------------------------- */

// Grupišemo po "<nadgrupa>|<podgrupa>" — isti oblik kao gsmexpert harvest, jer
// Level1 ("OPREMA ZA MOBILNI TELEFON I TABLET") meša maske, stakla, punjače i
// kablove, a tek Level2 kaže o čemu je reč.
const poKategoriji = {};
for (const red of svi.values()) {
  const kljuc = `${red[4]}|${red[5]}`;
  (poKategoriji[kljuc] ??= []).push([red[0], red[1], red[2], red[3]]);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(poKategoriji));

console.log("Sačuvano u data/gsm3g-harvest.json:");
for (const [k, v] of Object.entries(poKategoriji).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${v.length}	${k}`);
}
console.log(`  UKUPNO: ${svi.size}`);
const bezCene = [...svi.values()].filter((r) => r[2] === null).length;
console.log(`  bez cene: ${bezCene}`);
