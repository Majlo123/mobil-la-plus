import { productHref, type Product } from "@/lib/products";
import { altSlike } from "@/lib/opis-slike";
import { nasaSlika } from "@/lib/slike";
import {
  SLIKA_PO_DELU,
  deloviSlika,
  fotografijeZaIndeks,
  nepoznatDeo,
  slikaUnos,
  urlset,
  xmlOdgovor,
  type SlikaUnos,
} from "@/lib/sitemap";
import { site } from "@/lib/site";

/**
 * Delovi image sitemap-a — `/image-sitemap/1.xml`, `/image-sitemap/2.xml`…
 *
 * Spisak delova pravi `deloviSlika()`, isti izvor iz koga ih ispisuje indeks
 * `/image-sitemap.xml` (tamo stoji i zašto fotografije artikala sada uopšte
 * smeju u sitemap).
 *
 * Svaki unos vezuje TRI stvari: stranu na kojoj slika stoji, adresu slike na
 * našem domenu i tekst o njoj. Taj tekst je, uz naziv fajla, jedino po čemu
 * Google slike znaju šta je na fotografiji — sliku ne „gledaju".
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return deloviSlika().map((deo) => ({ deo: `${deo}.xml` }));
}

/**
 * Naša slika i strana na kojoj stoji.
 *
 * Ovde je samo logotip. Flajer se NE prikazuje na sajtu (poslat je kao izvor
 * podataka i smera dizajna, ne kao slika za objavu), pa nema ni šta da se
 * prijavi Google-u — sadržaj sa njega stoji kao tekst na `/servis`.
 */
const BREND_SLIKE: SlikaUnos[] = [
  {
    // Prazna putanja, a ne „/": početna se u `layout.tsx` proglašava kanonskom
    // bez kose crte na kraju, pa ovde mora da stoji isti oblik adrese.
    putanja: "",
    slika: "/images/brend/logo.jpg",
    naslov: `${site.name} — servis i oprema za mobilne telefone, ${site.city}`,
    opis: `Logotip radnje ${site.name}, ${site.address.full}.`,
  },
];

/**
 * Opis slike: „Maske i futrole za Galaxy A33 5G — TPU MATTE for SM-A336 zelena."
 *
 * Naslov (`altSlike`) je već ljudska rečenica, pa opis namerno ide drugim putem:
 * vrsta u množini onako kako se zove kategorija na sajtu, model i PUN kataloški
 * naziv sa šiframa dobavljača („SM-A336", „GH82-23496A"). Te šifre majstori i
 * kupci delova stvarno pretražuju, a iz naslova su izbačene jer tamo smetaju.
 *
 * Naziv radnje i grad se ne dopisuju — isti rep teksta na 33.502 slike je spam
 * signal, a ne lokalni; razlog je isti kao u `src/lib/opis-slike.ts`. Ko je
 * prodavac Google čita iz strukturiranih podataka strane na kojoj slika stoji.
 */
function opisSlike(p: Product): string {
  return p.modelLabel
    ? `${p.typeLabel} za ${p.modelLabel} — ${p.name}.`
    : `${p.typeLabel} — ${p.name}.`;
}

export function GET(_zahtev: Request, { params }: { params: { deo: string } }) {
  const ime = params.deo.replace(/\.xml$/, "");
  // Deo koji indeks ne navodi mora da bude 404, a ne prazan sitemap — isti
  // razlog kao kod `/sitemap/[deo]`, i isti izvor spiska kao u indeksu.
  if (!deloviSlika().includes(ime)) return nepoznatDeo();

  const broj = Number(ime);
  const od = (broj - 1) * SLIKA_PO_DELU;
  const fotografije = fotografijeZaIndeks().slice(od, od + SLIKA_PO_DELU);

  const unosi: SlikaUnos[] = [
    // Logotip ide u prvi deo — jedna slika ne zaslužuje svoj fajl, a u prvom
    // delu je sigurno obiđena.
    ...(broj === 1 ? BREND_SLIKE : []),
    ...fotografije.map((p) => ({
      putanja: productHref(p),
      // Bez `kadar` argumenta: adresa bez query-ja je ista ona koja stoji na
      // karticama artikala, pa Google indeksira baš sliku koju vidi i posetilac
      // (vidi `nasaSlika` u `src/lib/slike.ts`).
      slika: nasaSlika(p.slug),
      // Isti tekst koji je i `alt` te slike na strani — kad se poklope, Google
      // ima dva saglasna signala umesto dva različita.
      naslov: altSlike(p),
      opis: opisSlike(p),
    })),
  ];

  return xmlOdgovor(urlset(unosi.map(slikaUnos), true));
}
