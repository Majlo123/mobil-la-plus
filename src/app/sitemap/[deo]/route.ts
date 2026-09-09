import {
  getAllProducts,
  katalogBrojStrana,
  modelParams,
  modelTipParams,
  productBrands,
  productHref,
  productTypes,
} from "@/lib/products";
import { brendHref, kategorijaHref, modelHref, modelTipHref } from "@/lib/catalog";
import {
  ARTIKALA_PO_DELU,
  deloviStrana,
  nepoznatDeo,
  stranaUnos,
  urlset,
  xmlOdgovor,
  type StranaUnos,
} from "@/lib/sitemap";

/**
 * Delovi običnog sitemap-a: `/sitemap/strane.xml` i `/sitemap/artikli-N.xml`.
 *
 * Spisak delova pravi `deloviStrana()` — isti izvor iz koga ih ispisuje i indeks
 * `/sitemap.xml`, da indeks nikad ne navede deo koji ova ruta ne generiše.
 *
 * PODELA: „strane" su sve stranice pisane za pretragu (početna, kategorije,
 * marke, modeli, model × vrsta, kataloški indeks) — 3.532 URL-a u jednom fajlu.
 * Artikli idu posebno, po 10.000, jer ih je 35.901 i jer su najmanje vredni po
 * komadu: strana artikla dobija posetu tek kad neko traži baš taj artikal.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return deloviStrana().map((deo) => ({ deo: `${deo}.xml` }));
}

/**
 * Stranice koje su pisane da ih neko nađe u pretrazi.
 *
 * Prioriteti nisu ravnomerni namerno — Google ih koristi kao poredak UNUTAR
 * sajta, ne kao ocenu sajta:
 *
 *   0.8  model × vrsta („Ekrani za Galaxy S23") — tačno ono što kupac ukuca;
 *        najuža strana koja još uvek ima pravu ponudu (bar tri artikla)
 *   0.8  kategorija vrste artikla („Zaštitna stakla") — široka, ali nosi
 *        pretrage tipa „zaštitno staklo Novi Sad"
 *   0.7  model („Sve za Galaxy S23") i marka — raskrsnice ka gornjim stranama
 *   0.3  kataloški indeks — postoji da bi Googlebot uopšte došao do artikala,
 *        nije stranica za ljude
 */
function straneUnosi(): StranaUnos[] {
  const staticne: StranaUnos[] = [
    { putanja: "", ucestalost: "weekly", prioritet: 1 },
    // Prodavnica i servis su dve stvari zbog kojih ljudi i dolaze — zato oba
    // idu na vrh, iako servis ima jednu stranicu a prodavnica hiljade.
    { putanja: "/prodavnica", ucestalost: "weekly", prioritet: 0.9 },
    { putanja: "/servis", ucestalost: "monthly", prioritet: 0.9 },
    { putanja: "/kontakt", ucestalost: "monthly", prioritet: 0.7 },
    { putanja: "/o-nama", ucestalost: "yearly", prioritet: 0.5 },
  ];

  // Vrste artikala — „maske", „zaštitna stakla", „baterije".
  const kategorije: StranaUnos[] = productTypes().map((t) => ({
    putanja: kategorijaHref(t.key),
    ucestalost: "weekly",
    prioritet: 0.8,
  }));

  // Marke telefona — „sve za Xiaomi"; ulaz u spisak modela te marke.
  const brendovi: StranaUnos[] = productBrands().map((b) => ({
    putanja: brendHref(b.key),
    ucestalost: "weekly",
    prioritet: 0.7,
  }));

  // Modeli („Sve za Galaxy S23") — 1.367 strana, po jedna za svaki model koji
  // ima bar jedan artikal.
  const modeli: StranaUnos[] = modelParams().map(({ brend, model }) => ({
    putanja: modelHref(brend, model),
    ucestalost: "weekly",
    prioritet: 0.7,
  }));

  // Model × vrsta — 1.823 strane; samo kombinacije sa bar tri artikla
  // (`PRAG_ZA_TIP_STRANU`), pa u sitemap-u nema nijedne tanke strane.
  const modelTipovi: StranaUnos[] = modelTipParams().map(({ brend, model, tip }) => ({
    putanja: modelTipHref(brend, model, tip),
    ucestalost: "weekly",
    prioritet: 0.8,
  }));

  // Kataloški indeks — jedini put kojim svaki artikal dobija interni link
  // (prodavnica filtrira preko URL-a, pa Googlebot sam ne dođe do svega).
  const katalog: StranaUnos[] = Array.from({ length: katalogBrojStrana() }, (_, i) => ({
    putanja: `/katalog/${i + 1}`,
    ucestalost: "weekly",
    prioritet: 0.3,
  }));

  return [...staticne, ...kategorije, ...brendovi, ...modeli, ...modelTipovi, ...katalog];
}

/**
 * Artikli iz jednog dela. Redosled je redosled kataloga, pa artikal ostaje u
 * istom delu dok se katalog ne promeni — Google ne mora da obiđe sve delove
 * zbog jednog novog artikla.
 *
 * Artikal sa cenom je gotova stranica; „Cena na upit" znači da nabavna cena
 * nije proverena (vidi `data/cene-za-proveru.json`), pa ide niže.
 */
function artikliUnosi(deo: number): StranaUnos[] {
  const od = (deo - 1) * ARTIKALA_PO_DELU;
  return getAllProducts()
    .slice(od, od + ARTIKALA_PO_DELU)
    .map((p) => ({
      putanja: productHref(p),
      ucestalost: "monthly" as const,
      prioritet: p.price === null ? 0.4 : 0.6,
    }));
}

export function GET(_zahtev: Request, { params }: { params: { deo: string } }) {
  // `.xml` je deo imena rute, a ne podatak — vidi `generateStaticParams`.
  const ime = params.deo.replace(/\.xml$/, "");

  // Deo koji indeks ne navodi ne sme da vrati prazan (a formalno ispravan)
  // sitemap — to je najgori mogući odgovor: Google ga primi kao „ovde nema
  // ničega". `dynamicParams = false` ovo pokriva u produkciji, a ova provera
  // drži rutu i indeks vezane za isti spisak i kad se ruta pozove drugim putem.
  if (!deloviStrana().includes(ime)) return nepoznatDeo();

  if (ime === "strane") {
    return xmlOdgovor(urlset(straneUnosi().map(stranaUnos)));
  }

  // Ime je provereno gore, pa je ovo uvek broj dela („artikli-3" → 3).
  return xmlOdgovor(
    urlset(artikliUnosi(Number(ime.slice("artikli-".length))).map(stranaUnos)),
  );
}
