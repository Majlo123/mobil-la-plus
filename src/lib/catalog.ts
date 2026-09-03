/**
 * Katalog — deljeni pojmovi koje smeju da uvezu i klijentske komponente:
 * slugovi, normalizacija teksta, definicije faseta i cenovni razredi.
 *
 * Ovde NEMA samih proizvoda. Katalog ima preko 10.000 artikala (~1,5 MB), pa se
 * NIKAD ne šalje u pretraživač: filtriranje se radi na serveru u
 * `src/lib/shop-query.ts` nad podacima iz `src/lib/products.ts`. Zato je i
 * klijentski deo prodavnice samo kontrola koja menja URL, a ne držač podataka.
 *
 * (Plugeks je filtrirao u pretraživaču jer je imao ~4.600 delova; sa ovim
 * obimom bi to bio višemegabajtni download na mobilnom internetu.)
 */

/* --------------------------------- Fasete ---------------------------------- */

export type FacetDef = {
  key: string;
  label: string;
  /** Tekst u praznom polju kad ništa nije izabrano. */
  placeholder: string;
};

/**
 * `model` je najvažnija faseta u ovom katalogu, a ne najočiglednija.
 *
 * Kupac ne traži „masku" nego „masku za svoj telefon". Bez modela, „maske +
 * Samsung" daje 8.931 rezultat kroz koje niko ne prelistava — a to je bio slučaj
 * dok je model postojao samo kao tekst na kartici. Zato stoji odmah posle marke,
 * a `MultiSelect` u njemu ima pretragu (ima ih nekoliko stotina).
 */
export const FACETS: FacetDef[] = [
  { key: "tip", label: "Vrsta artikla", placeholder: "Sve vrste" },
  { key: "brend", label: "Marka telefona", placeholder: "Sve marke" },
  { key: "model", label: "Model telefona", placeholder: "Svi modeli" },
  { key: "cena", label: "Cenovni razred", placeholder: "Sve cene" },
];

export type FacetOption = { value: string; label: string; count: number };

/* ----------------------------- Cenovni razredi ----------------------------- */

/**
 * Granice su u dinarima i birane su tako da svaki razred ima smislen broj
 * artikala u ovom asortimanu (sitna oprema do ~2.500, ekrani i telefoni iznad).
 */
export const CENOVNI_RAZREDI: {
  key: string;
  label: string;
  min: number;
  max: number | null;
}[] = [
  { key: "do-1000", label: "do 1.000 RSD", min: 0, max: 1000 },
  { key: "1000-2500", label: "1.000 – 2.500 RSD", min: 1000, max: 2500 },
  { key: "2500-5000", label: "2.500 – 5.000 RSD", min: 2500, max: 5000 },
  { key: "5000-10000", label: "5.000 – 10.000 RSD", min: 5000, max: 10000 },
  { key: "preko-10000", label: "preko 10.000 RSD", min: 10000, max: null },
];

/** Ključ cenovnog razreda za datu cenu; `null` za artikle bez cene. */
export function cenovniRazred(price: number | null): string | null {
  if (price === null) return null;
  for (const r of CENOVNI_RAZREDI) {
    if (price >= r.min && (r.max === null || price < r.max)) return r.key;
  }
  return null;
}

export const CENOVNI_LABELE: Record<string, string> = Object.fromEntries(
  CENOVNI_RAZREDI.map((r) => [r.key, r.label]),
);

/* -------------------------------- Sortiranje ------------------------------- */

export type SortKey = "naziv" | "cena-rastuce" | "cena-opadajuce";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "naziv", label: "Po nazivu" },
  { key: "cena-rastuce", label: "Cena: od najniže" },
  { key: "cena-opadajuce", label: "Cena: od najviše" },
];

export const isSortKey = (v: string | null): v is SortKey =>
  v === "naziv" || v === "cena-rastuce" || v === "cena-opadajuce";

/* --------------------------------- Tekst ----------------------------------- */

/** „Zaštitno staklo Xiaomi" → „zastitno staklo xiaomi" (pretraga bez dijakritike). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // razlaže „č" na „c" + kombinujući akcenat, koji zatim brišemo
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/ł/g, "l");
}

/* --------------------------------- Slugovi --------------------------------- */

/**
 * SEO-slug proizvoda: „Baterija za iPhone 15" + „ge-13506" →
 * „baterija-za-iphone-15-ge-13506".
 *
 * Živi ovde (a ne u `products.ts`) da bi ga smele koristiti i klijentske
 * komponente — bez uvlačenja celog kataloga u bundle.
 */
export function productSlug(name: string, id: string): string {
  const base = normalize(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70)
    .replace(/-+$/g, "");
  return `${base}-${id}`;
}

/** Iz slug-a vadi id proizvoda („…-ge-13506" → „ge-13506"). */
export function idFromSlug(slug: string): string | null {
  return slug.match(/-((?:ge|vm|g3)-\d+)$/)?.[1] ?? null;
}

/** Putanja do detaljne stranice proizvoda. */
export const productPath = (item: { id: string; name: string }) =>
  `/proizvod/${productSlug(item.name, item.id)}`;

/* ---------------------------------- Linkovi -------------------------------- */

export const kategorijaHref = (tip: string) => `/kategorija/${tip}`;
export const brendHref = (brend: string) => `/za-telefon/${brend}`;

/** Prodavnica sa unaprijed postavljenim filterom. */
export const prodavnicaHref = (params: Record<string, string> = {}) => {
  const qs = new URLSearchParams(params).toString();
  return qs ? `/prodavnica?${qs}` : "/prodavnica";
};
