/**
 * Zajednički alat za sve sitemap-e: pisanje XML-a i podela kataloga na delove.
 *
 * ZAŠTO SE XML PIŠE RUČNO, a ne kroz ugrađeni `MetadataRoute.Sitemap`:
 *
 *  1. Ugrađeni sitemap ne ume `<image:image>`, a fotografije su pola posla oko
 *     Google slika (vidi `/image-sitemap.xml`).
 *  2. Ne ume ni `<sitemapindex>`, a jedan sitemap fajl sme do 50.000 URL-ova.
 *     Sajt ih ima 39.433 (5 statičkih + 13 kategorija + 24 marke + 1.367 modela
 *     + 1.823 model × vrsta + 300 kataloških + 35.901 artikal) — staje, ali bez
 *     rezerve: sledeći dobavljač u `npm run katalog` prelazi granicu i sitemap
 *     tiho prestaje da važi. Zato se deli SADA, dok je promena jeftina.
 *  3. Next ima `generateSitemaps()` baš za tu podelu, ali po ceni koja se ne
 *     isplati: čim `src/app/sitemap.ts` izveze tu funkciju, Next u produkciji
 *     BRIŠE rutu `/sitemap.xml` i ostavlja samo delove `/sitemap/0.xml`,
 *     `/sitemap/1.xml`… (u `next/dist/build/index.js` ključ rute
 *     `sitemap.xml/[[...__metadata_id__]]` se zameni sa `sitemap/[__metadata_id__]`).
 *     Ostati bez `/sitemap.xml` znači ostati bez adrese koju svi prvo probaju —
 *     Search Console, tuđi alati i sam vlasnik. Zato je `/sitemap.xml` ovde
 *     običan route handler koji vraća INDEKS sa spiskom delova.
 *
 * Podela živi u ovom modulu, a ne u rutama, jer indeks i delovi moraju da se
 * slažu u dlaku: deo koji indeks navede a ruta ne generiše je 404 u Search
 * Console-u, a deo koji indeks ne navede Google nikad ne obiđe.
 */

import { getAllProducts, getProductsWithPhotos, type Product } from "@/lib/products";
import { JE_PRAZNA_SLIKA } from "@/lib/slike";
import { SITE_URL } from "@/lib/site";

/* ---------------------------------- XML ------------------------------------ */

/**
 * Nazivi artikala dolaze sa veleprodajnih sajtova i u njima ima svega — „&",
 * navodnika, uglastih zagrada. Bez ovoga jedan takav naziv obori ceo fajl:
 * Google neispravan XML ne čita delimično, nego odbaci sitemap u celosti.
 */
export const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );

/**
 * `lastmod` za sve unose — trenutak pravljenja build-a.
 *
 * Sve sitemap rute su statičke (nemaju pristup zahtevu), pa se ovaj modul
 * izvršava u build-u, a ne po poseti: datum je isti u svakom delu istog build-a
 * i ne menja se dok se sajt ponovo ne objavi. Time se drži i pravilo da render
 * bude deterministički — vreme ulazi u HTML tačno jednom, ovde, i to namerno.
 *
 * Datum je iskren koliko može da bude: strane se i prave iz kataloga u build-u,
 * pa je „poslednja izmena" upravo poslednji `npm run katalog` + deploy.
 */
export const IZGRADJENO = new Date().toISOString();

export type Ucestalost = "daily" | "weekly" | "monthly" | "yearly";

export type StranaUnos = {
  /** Putanja bez domena („/kategorija/maske"). */
  putanja: string;
  ucestalost: Ucestalost;
  /** 0–1; `toFixed(1)` da zapis bude isti u svakom build-u. */
  prioritet: number;
};

export const stranaUnos = ({ putanja, ucestalost, prioritet }: StranaUnos) =>
  `  <url>\n    <loc>${escapeXml(`${SITE_URL}${putanja}`)}</loc>\n` +
  `    <lastmod>${IZGRADJENO}</lastmod>\n` +
  `    <changefreq>${ucestalost}</changefreq>\n` +
  `    <priority>${prioritet.toFixed(1)}</priority>\n  </url>`;

export type SlikaUnos = {
  /** Strana na kojoj slika stoji — Google indeksira sliku zajedno sa njom. */
  putanja: string;
  /** Adresa same fotografije, obavezno na NAŠEM domenu (vidi `nasaSlika`). */
  slika: string;
  naslov: string;
  opis: string;
};

/**
 * `<image:title>` i `<image:caption>` nisu ukras: uz naziv fajla, to je jedini
 * tekst koji Google slike dobiju o fotografiji koju ne ume da „pogleda".
 */
export const slikaUnos = ({ putanja, slika, naslov, opis }: SlikaUnos) =>
  `  <url>\n    <loc>${escapeXml(`${SITE_URL}${putanja}`)}</loc>\n    <image:image>\n` +
  `      <image:loc>${escapeXml(`${SITE_URL}${slika}`)}</image:loc>\n` +
  `      <image:title>${escapeXml(naslov)}</image:title>\n` +
  `      <image:caption>${escapeXml(opis)}</image:caption>\n` +
  `    </image:image>\n  </url>`;

/** Sitemap sa spiskom stranica; `saSlikama` dodaje `image:` namespace. */
export function urlset(unosi: string[], saSlikama = false): string {
  const nsSlika = saSlikama
    ? ` xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"`
    : "";
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${nsSlika}>\n` +
    `${unosi.join("\n")}\n</urlset>\n`
  );
}

/**
 * Indeks — sitemap koji nabraja druge sitemap-e.
 *
 * Indeks NE sme da pokazuje na drugi indeks (Google to odbija), pa `/sitemap.xml`
 * i `/image-sitemap.xml` ostaju dva odvojena stabla; oba su prijavljena u
 * `robots.ts`.
 */
export function sitemapIndeks(putanje: string[]): string {
  const unosi = putanje
    .map(
      (p) =>
        `  <sitemap>\n    <loc>${escapeXml(`${SITE_URL}${p}`)}</loc>\n` +
        `    <lastmod>${IZGRADJENO}</lastmod>\n  </sitemap>`,
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unosi}\n</sitemapindex>\n`
  );
}

/**
 * Isti odgovor za svaki sitemap. Sat vremena keša: sitemap se menja samo sa
 * novim build-om, a duži keš bi posle objave ostavio Googlebot-u stari spisak.
 */
export function xmlOdgovor(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

/** Odgovor za deo koji ne postoji — nikad se ne dešava dok indeks i rute rade. */
export const nepoznatDeo = () =>
  new Response("Taj deo sitemap-a ne postoji.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

/* -------------------------------- Podela ----------------------------------- */

/**
 * Koliko artikala ide u jedan deo.
 *
 * Granica je 50.000 URL-ova po fajlu, ali 10.000 je namerno mnogo ispod nje:
 * delovi ostaju mali (par MB), Search Console pokazuje gde tačno pada obilazak,
 * a rast kataloga dodaje nov deo umesto da naduva postojeći.
 */
export const ARTIKALA_PO_DELU = 10_000;

/**
 * Koliko fotografija ide u jedan deo image sitemap-a.
 *
 * Manje nego kod stranica jer je unos sa `<image:image>` blokom nekoliko puta
 * duži, a Google za image sitemap i preporučuje sitnije fajlove.
 */
export const SLIKA_PO_DELU = 5_000;

const brojDelova = (ukupno: number, poDelu: number) =>
  Math.max(1, Math.ceil(ukupno / poDelu));

/** [1, 2, … n] — delovi se broje od jedan jer ih čita i čovek u Search Console-u. */
const redomDelovi = (koliko: number) => Array.from({ length: koliko }, (_, i) => i + 1);

/**
 * Fotografije koje smeju u image sitemap.
 *
 * Placeholder slike dobavljača se izbacuju: `/slika/[slug]` za njih namerno
 * vraća 404 (vidi `JE_PRAZNA_SLIKA`), pa bi njihovo prijavljivanje bilo 332
 * promašena obilaska i isto toliko grešaka u Search Console-u.
 *
 * Redosled je redosled kataloga — stabilan između build-ova, pa artikal ostaje
 * u istom delu sve dok se katalog ne promeni.
 */
export function fotografijeZaIndeks(): Product[] {
  return getProductsWithPhotos().filter((p) => !JE_PRAZNA_SLIKA(p.image));
}

/**
 * Imena delova običnog sitemap-a, redom kako stoje u indeksu.
 *
 * Prvi deo („strane") nosi sve što je pisano za ljude i za pretragu — početnu,
 * kategorije, marke, modele i model × vrstu. Drži se odvojeno od artikala baš
 * zato što je najvredniji: kad Google usporeno obilazi 36.000 artikala, taj
 * jedan fajl je i dalje obiđen ceo.
 */
export function deloviStrana(): string[] {
  const artikli = redomDelovi(brojDelova(getAllProducts().length, ARTIKALA_PO_DELU));
  return ["strane", ...artikli.map((i) => `artikli-${i}`)];
}

/** Imena delova image sitemap-a — same brojke, jer su svi delovi iste vrste. */
export function deloviSlika(): string[] {
  return redomDelovi(brojDelova(fotografijeZaIndeks().length, SLIKA_PO_DELU)).map(String);
}
