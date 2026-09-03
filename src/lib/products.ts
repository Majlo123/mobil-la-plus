/**
 * Serverski model proizvoda — jedinstveni pogled na katalog za pojedinačne
 * stranice `/proizvod/[slug]`, kategorijske stranice i sitemap.
 *
 * Ovaj modul se učitava SAMO na serveru (u server komponentama, generateMetadata,
 * generateStaticParams i sitemap-u). Zato sme da statički uveze `products.json`
 * — taj teret nikad ne ode u pretraživač. Klijentski katalog i dalje koristi
 * lazy `loadProducts()` iz `@/lib/catalog`.
 *
 * Sav opisni tekst ovde je originalan (napisan za Mobil Plus LA) — ne prevodi
 * se i ne prepisuje sa veleprodajnih sajtova.
 */

import packed from "@/data/products.json";
import { categories } from "@/lib/data";
import { productSlug, idFromSlug, cenovniRazred } from "@/lib/catalog";

/* ---------------------------------- Model ---------------------------------- */

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Maloprodajna cena u dinarima; `null` = „Cena na upit". */
  price: number | null;
  image?: string;
  typeKey: string;
  typeLabel: string;
  brandKey?: string;
  brandLabel?: string;
  /** Model telefona za koji artikal odgovara, ako je poznat. */
  model?: string;
};

export { productSlug, idFromSlug };

export const productHref = (p: Product) => `/proizvod/${p.slug}`;

/* -------------------------------- Indeksi ---------------------------------- */

type PackedCatalog = {
  types: { key: string; label: string }[];
  brands: { key: string; label: string }[];
  items: [string, string, number | null, string | null, number, number, string | null][];
};

let cache: {
  all: Product[];
  byId: Map<string, Product>;
  bySlug: Map<string, Product>;
} | null = null;

function build() {
  if (cache) return cache;

  const tables = packed as unknown as PackedCatalog;
  const at = (table: { key: string; label: string }[], i: number) =>
    i >= 0 ? table[i] : undefined;

  const all: Product[] = tables.items.map(([id, name, price, image, t, b, model]) => {
    const type = at(tables.types, t);
    const brand = at(tables.brands, b);
    return {
      id,
      slug: productSlug(name, id),
      name,
      price,
      ...(image ? { image } : {}),
      typeKey: type?.key ?? "ostalo",
      typeLabel: type?.label ?? "Ostalo",
      ...(brand ? { brandKey: brand.key, brandLabel: brand.label } : {}),
      ...(model ? { model } : {}),
    };
  });

  const byId = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  for (const p of all) {
    byId.set(p.id, p);
    bySlug.set(p.slug, p);
  }

  cache = { all, byId, bySlug };
  return cache;
}

export function getAllProducts(): Product[] {
  return build().all;
}

/** Traži po canonical slug-u; ako se ne poklopi, pokušava po id-u iz slug-a. */
export function getProductBySlug(slug: string): Product | undefined {
  const { bySlug, byId } = build();
  const exact = bySlug.get(slug);
  if (exact) return exact;
  const id = idFromSlug(slug);
  return id ? byId.get(id) : undefined;
}

/** Proizvodi koji imaju fotografiju — za image sitemap. */
export function getProductsWithPhotos(): Product[] {
  return build().all.filter((p) => p.image);
}

/**
 * Srodni proizvodi za dno stranice. Bira iste vrste/brenda/modela, uz stabilan
 * (deterministički) redosled — bez `Math.random`, da se HTML ne menja između
 * build-ova.
 */
export function relatedProducts(p: Product, limit = 4): Product[] {
  const { all } = build();
  const score = (o: Product) => {
    if (o.id === p.id) return -1;
    let s = 0;
    if (o.model && p.model && o.model === p.model) s += 4;
    if (o.typeKey === p.typeKey) s += 3;
    if (o.brandKey && o.brandKey === p.brandKey) s += 2;
    if (cenovniRazred(o.price) === cenovniRazred(p.price)) s += 1;
    return s;
  };
  return all
    .map((o) => ({ o, s: score(o) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.o.name.localeCompare(b.o.name, "sr"))
    .slice(0, limit)
    .map((x) => x.o);
}

/* ------------------------------ Opisni tekst ------------------------------- */
/* Originalan srpski tekst pisan za Mobil Plus LA — nije prepis izvora.        */

/**
 * Uvodna rečenica po vrsti artikla. Namerno bez izmišljenih specifikacija
 * (mAh, nits, tvrdoća stakla) — one se ne mogu izvesti iz naziva artikla.
 */
const OPIS_PO_TIPU: Record<string, string> = {
  maske:
    "Maska štiti telefon od udara i ogrebotina, a da pritom ne pravi smetnju pri korišćenju. Ako ne vidite masku za svoj model, javite se — radimo i maske po želji, sa vašom slikom.",
  stakla:
    "Kaljeno staklo prima udarac umesto displeja i menja se za nekoliko minuta. Postavljamo ga u radnji, bez vazdušnih mehurića — ako se pri postavljanju ošteti, menjamo ga bez naplate.",
  punjaci:
    "Punjač sa stabilnim naponom i zaštitom od pregrevanja. Loš punjač je najčešći razlog za oštećenje baterije i konektora, pa se ovde ne isplati štedeti.",
  kablovi:
    "Kabl za punjenje i prenos podataka sa ojačanim priključcima — deo koji se prvi pokvari kod svakodnevnog nošenja u torbi.",
  baterije:
    "Zamenska baterija sa ugradnjom u našem servisu. Ako telefon drži znatno manje nego ranije ili se gasi na 20%, baterija je gotovo sigurno uzrok.",
  ekrani:
    "Ekran sa touch screenom, sa ugradnjom u našem servisu. Recite nam model i da li želite originalan, service pack ili kvalitetan zamenski deo — objasnimo razliku u ceni i kvalitetu pre rada.",
  audio:
    "Slušalice i zvučnici za svakodnevnu upotrebu — proverite kod nas zvuk pre kupovine.",
  powerbank:
    "Prenosiva baterija i držači za telefon — za put, auto i duže dane van kuće.",
  telefoni:
    "Telefon iz naše ponude, sa garancijom. Javite se da potvrdimo trenutnu dostupnost i stanje uređaja pre kupovine.",
  satovi:
    "Pametni sat za obaveštenja, pozive i merenje aktivnosti — uparuje se sa Android i iPhone telefonima.",
  memorije:
    "Memorijska kartica za proširenje prostora u telefonu — proverite pre kupovine da li vaš model ima slot za karticu.",
  delovi:
    "Servisni deo za popravku telefona. Prodajemo i majstorima; ako vam treba ugradnja, radimo je u našem servisu na Braće Ribnikar 17.",
};

/** Opis proizvoda — kombinuje vrstu artikla, model i način nabavke. */
export function productDescription(p: Product): string {
  const uvod =
    OPIS_PO_TIPU[p.typeKey] ??
    "Artikal iz naše ponude opreme za mobilne telefone.";
  const zaModel = p.model
    ? ` Odgovara modelu ${p.model}.`
    : p.brandLabel
      ? ` Namenjen telefonima ${p.brandLabel}.`
      : "";
  return `${uvod}${zaModel}`;
}

/** Kratke, iskrene stavke ispod cene — bez obećanja koja ne možemo držati. */
export function productHighlights(p: Product): string[] {
  const ugradnja = ["ekrani", "baterije", "delovi"].includes(p.typeKey);
  return [
    ...(ugradnja ? ["Ugradnja u našem servisu, uz garanciju na deo"] : []),
    ...(p.typeKey === "stakla" ? ["Postavljamo u radnji, bez mehurića"] : []),
    "Proverite dostupnost na Viber ili WhatsApp — odgovaramo isti dan",
    "Preuzimanje u radnji: Braće Ribnikar 17, Novi Sad",
    "Slanje kurirskom službom širom Srbije",
  ];
}

/* --------------------------- Kategorije za SEO ---------------------------- */

/**
 * Rute ispod postoje zato što je `/prodavnica` klijentska komponenta: filtrira u
 * pretraživaču i prikazuje ograničen broj po strani uz dugme „Prikaži još".
 * Googlebot izvrši JS, ali ne klikće dugmad, pa u HTML-u prodavnice nema
 * nijednog linka ka proizvodu. Bez ovih ruta bi hiljade artikala postojale samo
 * u sitemap-u, bez ijednog internog linka — što Google po pravilu ostavlja u
 * „Discovered – currently not indexed".
 */

export type Kategorija = { key: string; label: string; count: number };

const sortiraj = (a: Kategorija, b: Kategorija) =>
  b.count - a.count || a.label.localeCompare(b.label, "sr");

function prebroj(
  items: Product[],
  kljuc: (p: Product) => string | undefined,
  naziv: (p: Product) => string | undefined,
): Kategorija[] {
  const mapa = new Map<string, Kategorija>();
  for (const p of items) {
    const k = kljuc(p);
    if (!k) continue;
    const postojeci = mapa.get(k);
    if (postojeci) postojeci.count += 1;
    else mapa.set(k, { key: k, label: naziv(p) ?? k, count: 1 });
  }
  return [...mapa.values()].sort(sortiraj);
}

/** Vrste artikala (maske, stakla, baterije…) — po njima ljudi i pretražuju. */
export function productTypes(): Kategorija[] {
  return prebroj(getAllProducts(), (p) => p.typeKey, (p) => p.typeLabel);
}

/** Brendovi telefona za koje postoji oprema (Apple, Samsung, Xiaomi…). */
export function productBrands(): Kategorija[] {
  return prebroj(
    getAllProducts().filter((p) => p.brandKey && p.brandKey !== "univerzalno"),
    (p) => p.brandKey,
    (p) => p.brandLabel,
  );
}

export const getProductsByType = (typeKey: string) =>
  getAllProducts().filter((p) => p.typeKey === typeKey);

export const getProductsByBrand = (brandKey: string) =>
  getAllProducts().filter((p) => p.brandKey === brandKey);

/** Opis kategorijske stranice — dopunjava tekst iz `lib/data.ts` brojem artikala. */
export function typeDescription(typeKey: string): string {
  const cat = categories.find((c) => c.key === typeKey);
  return cat?.description ?? "Artikli iz naše ponude opreme za mobilne telefone.";
}

/* ------------------------ Šta se pravi u build-u -------------------------- */

/**
 * Koliko strana proizvoda po vrsti artikla se pravi unapred. Ostale se
 * generišu pri prvom otvaranju (vidi komentar u `/proizvod/[slug]/page.tsx`).
 *
 * Granica po VRSTI, a ne globalno, da „Maske" (preko 20.000 artikala) ne
 * pojedu celu kvotu i ostave „Ekrane" i „Baterije" bez ijedne gotove strane.
 */
const STATICKIH_PO_VRSTI = 150;

/**
 * Artikli za koje se strana pravi u build-u: prvo oni sa fotografijom i cenom
 * (to su strane koje i izgledaju kao proizvod), pa po abecedi za stabilan
 * redosled između build-ova.
 */
export function staticProductParams(): { slug: string }[] {
  const poVrsti = new Map<string, Product[]>();
  for (const p of getAllProducts()) {
    if (!p.image || p.price === null) continue;
    const lista = poVrsti.get(p.typeKey) ?? [];
    if (lista.length < STATICKIH_PO_VRSTI) {
      lista.push(p);
      poVrsti.set(p.typeKey, lista);
    }
  }
  return [...poVrsti.values()].flat().map((p) => ({ slug: p.slug }));
}

/** Koliko proizvoda ide na jednu stranu kataloškog indeksa. */
export const KATALOG_PO_STRANI = 120;

export function katalogBrojStrana(): number {
  return Math.max(1, Math.ceil(getAllProducts().length / KATALOG_PO_STRANI));
}

export function katalogStrana(strana: number): Product[] {
  const start = (strana - 1) * KATALOG_PO_STRANI;
  return getAllProducts().slice(start, start + KATALOG_PO_STRANI);
}
