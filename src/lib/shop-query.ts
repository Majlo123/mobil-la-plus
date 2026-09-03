/**
 * Filtriranje, brojanje faseta i paginacija prodavnice — SERVERSKI.
 *
 * Uvozi `products.ts`, dakle i ceo `products.json`, pa se sme koristiti samo u
 * server komponentama (`/prodavnica`, kategorijske strane, `generateMetadata`).
 * Vidi objašnjenje u `src/lib/catalog.ts` zašto filtriranje nije u pretraživaču.
 *
 * Stanje filtera živi u URL-u (`?tip=maske,stakla&brend=apple&q=…&strana=2`),
 * pa je svaki filtriran prikaz deljiv linkom i indeksabilan — a klijentu ne
 * treba ni jedan bajt kataloga.
 */

import {
  CENOVNI_LABELE,
  CENOVNI_RAZREDI,
  FACETS,
  cenovniRazred,
  isSortKey,
  normalize,
  type FacetOption,
  type SortKey,
} from "@/lib/catalog";
import { getAllProducts, type Product } from "@/lib/products";

/** Koliko artikala ide na jednu stranu prodavnice. */
export const PO_STRANI = 24;

export type Izbor = Record<string, string[]>;

export type Upit = {
  izbor: Izbor;
  q: string;
  sort: SortKey;
  strana: number;
};

/* ------------------------------ Čitanje URL-a ------------------------------ */

/** Vrednosti fasete se u URL-u čuvaju kao `tip=maske,stakla`. */
const parseList = (raw: string | undefined) =>
  raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : [];

/**
 * Pretvara `searchParams` u strukturiran upit. Nepoznate vrednosti se tiho
 * odbacuju — `?tip=izmisljeno` daje prazan filter, ne 500.
 */
export function parseUpit(
  searchParams: Record<string, string | string[] | undefined>,
): Upit {
  const jedan = (k: string) => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const izbor: Izbor = {};
  for (const f of FACETS) izbor[f.key] = parseList(jedan(f.key));

  const stranaRaw = Number.parseInt(jedan("strana") ?? "1", 10);
  const sortRaw = jedan("sort") ?? null;

  return {
    izbor,
    q: (jedan("q") ?? "").slice(0, 120), // gornja granica — pretraga nije kanal za payload
    sort: isSortKey(sortRaw) ? sortRaw : "naziv",
    strana: Number.isFinite(stranaRaw) && stranaRaw > 0 ? stranaRaw : 1,
  };
}

/** Gradi query string iz upita — za linkove paginacije i „poništi filter". */
export function upitUQuery(upit: Partial<Upit>): string {
  const p = new URLSearchParams();
  for (const [key, values] of Object.entries(upit.izbor ?? {})) {
    if (values.length) p.set(key, values.join(","));
  }
  if (upit.q) p.set("q", upit.q);
  if (upit.sort && upit.sort !== "naziv") p.set("sort", upit.sort);
  if (upit.strana && upit.strana > 1) p.set("strana", String(upit.strana));
  return p.toString();
}

/* -------------------------------- Filtriranje ------------------------------ */

/** Vrednost artikla za datu fasetu — cena se izvodi iz cenovnog razreda. */
function vrednost(p: Product, facetKey: string): string | undefined {
  if (facetKey === "tip") return p.typeKey;
  if (facetKey === "brend") return p.brandKey;
  if (facetKey === "cena") return cenovniRazred(p.price) ?? undefined;
  return undefined;
}

/**
 * Faseta bez izabranih opcija ne filtrira; unutar fasete važi ILI, između
 * faseta I. Pretraga traži SVE termine (redosled nije bitan), pa
 * „staklo iphone 15" nađe i „Zaštitno staklo za iPhone 15 Pro".
 */
export function filtriraj(items: Product[], izbor: Izbor, q: string): Product[] {
  const aktivne = Object.entries(izbor).filter(([, v]) => v.length > 0);
  const termini = normalize(q).split(/\s+/).filter(Boolean);
  if (aktivne.length === 0 && termini.length === 0) return items;

  return items.filter((p) => {
    for (const [key, values] of aktivne) {
      const v = vrednost(p, key);
      if (!v || !values.includes(v)) return false;
    }
    if (termini.length === 0) return true;
    const tekst = normalize(`${p.name} ${p.brandLabel ?? ""} ${p.typeLabel} ${p.model ?? ""}`);
    return termini.every((t) => tekst.includes(t));
  });
}

/* ------------------------------ Opcije fasete ------------------------------ */

/**
 * Gradi opcije za jednu fasetu, sa brojem pogodaka.
 *
 * Broji se nad artiklima filtriranim po SVIM ostalim fasetama, ali ne i po
 * ovoj — tako korisnik vidi koliko bi rezultata dobio kad bi dodao još jednu
 * čekiranu opciju, umesto svuda nule.
 */
export function opcijeFasete(
  items: Product[],
  facetKey: string,
  izbor: Izbor,
  q: string,
): FacetOption[] {
  const ostale = { ...izbor };
  delete ostale[facetKey];
  const pool = filtriraj(items, ostale, q);

  const brojevi = new Map<string, number>();
  const labele = new Map<string, string>();
  for (const p of pool) {
    const v = vrednost(p, facetKey);
    if (!v) continue;
    brojevi.set(v, (brojevi.get(v) ?? 0) + 1);
    if (!labele.has(v)) {
      labele.set(
        v,
        facetKey === "tip"
          ? p.typeLabel
          : facetKey === "brend"
            ? (p.brandLabel ?? v)
            : (CENOVNI_LABELE[v] ?? v),
      );
    }
  }

  // Izabrane opcije ostaju vidljive i kad im broj padne na nulu — inače
  // korisnik ne može da odčekira ono što je sam izabrao.
  for (const v of izbor[facetKey] ?? []) {
    if (!brojevi.has(v)) {
      brojevi.set(v, 0);
      if (!labele.has(v)) labele.set(v, CENOVNI_LABELE[v] ?? v);
    }
  }

  const opcije = [...brojevi.entries()].map(([value, count]) => ({
    value,
    label: labele.get(value) ?? value,
    count,
  }));

  // Cenovni razredi imaju prirodan redosled (od najjeftinijeg); ostale fasete
  // sortiramo po broju pogodaka, jer tamo abecedni red nikome ne pomaže.
  if (facetKey === "cena") {
    const rank = new Map(CENOVNI_RAZREDI.map((r, i) => [r.key, i]));
    return opcije.sort((a, b) => (rank.get(a.value) ?? 99) - (rank.get(b.value) ?? 99));
  }
  return opcije.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sr"));
}

/* -------------------------------- Sortiranje ------------------------------- */

/**
 * Artikli bez cene idu na KRAJ i kod rastućeg i kod opadajućeg sortiranja —
 * „Cena na upit" nije ni najjeftinije ni najskuplje, pa ne treba da zauzima
 * prvi ekran.
 */
export function sortiraj(items: Product[], sort: SortKey): Product[] {
  const copy = [...items];
  if (sort === "naziv") return copy.sort((a, b) => a.name.localeCompare(b.name, "sr"));

  const dir = sort === "cena-rastuce" ? 1 : -1;
  return copy.sort((a, b) => {
    if (a.price === null && b.price === null) return a.name.localeCompare(b.name, "sr");
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return (a.price - b.price) * dir || a.name.localeCompare(b.name, "sr");
  });
}

/* --------------------------------- Rezultat -------------------------------- */

export type Rezultat = {
  /** Artikli za tekuću stranu. */
  strana: Product[];
  /** Ukupan broj pogodaka (pre paginacije). */
  ukupno: number;
  brojStrana: number;
  tekucaStrana: number;
  fasete: { def: (typeof FACETS)[number]; opcije: FacetOption[] }[];
  /** Broj aktivnih filtera + pretraga — za dugme „Poništi filtere (N)". */
  aktivnih: number;
};

/**
 * Jedan poziv koji strana prodavnice treba: filtrira, sortira, izbroji fasete i
 * iseca stranu. `osnova` omogućava kategorijskim stranama da rade nad podskupom
 * (npr. samo maske) uz iste filtere.
 */
export function pretrazi(upit: Upit, osnova?: Product[]): Rezultat {
  const svi = osnova ?? getAllProducts();
  const nadjeni = sortiraj(filtriraj(svi, upit.izbor, upit.q), upit.sort);

  const brojStrana = Math.max(1, Math.ceil(nadjeni.length / PO_STRANI));
  const tekucaStrana = Math.min(upit.strana, brojStrana);
  const start = (tekucaStrana - 1) * PO_STRANI;

  return {
    strana: nadjeni.slice(start, start + PO_STRANI),
    ukupno: nadjeni.length,
    brojStrana,
    tekucaStrana,
    fasete: FACETS.map((def) => ({
      def,
      opcije: opcijeFasete(svi, def.key, upit.izbor, upit.q),
    })),
    aktivnih: Object.values(upit.izbor).flat().length + (upit.q ? 1 : 0),
  };
}
