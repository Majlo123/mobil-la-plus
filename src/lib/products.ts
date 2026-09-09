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
  /**
   * Model telefona za koji artikal odgovara — kanonski ključ i naziv.
   *
   * Ne dolazi iz naziva „kako jeste": nazivi dobavljača daju 7.918 različitih
   * varijanti (samo „S23" ima 90), pa se model PREPOZNAJE poređenjem sa
   * rečnikom pravih modela — vidi `scripts/modeli-dictionary.mjs`.
   */
  modelKey?: string;
  modelLabel?: string;
};

export { productSlug, idFromSlug };

export const productHref = (p: Product) => `/proizvod/${p.slug}`;

/* -------------------------------- Indeksi ---------------------------------- */

type PackedCatalog = {
  types: { key: string; label: string }[];
  brands: { key: string; label: string }[];
  /** Kanonski modeli telefona; `brand` vezuje model za marku. */
  models: { key: string; label: string; brand: string }[];
  /** [id, naziv, cenaRSD, slika, tipIdx, brendIdx, modelIdx] — idx -1 = nema. */
  items: [string, string, number | null, string | null, number, number, number][];
};

/**
 * Ključ kombinacije model + vrsta artikla („galaxy-s23|ekrani").
 *
 * Uspravna crta se ne pojavljuje ni u jednom slug-u (svi prolaze kroz
 * `normalize()` + `[^a-z0-9]+`), pa spajanje ključeva ne može da napravi sudar.
 */
const komboKljuc = (modelKey: string, tipKey: string) => `${modelKey}|${tipKey}`;

/**
 * Zajednički redosled za sve spiskove (vrste, marke, modeli): najzastupljeniji
 * prvi, a pri istom broju abecedno po `sr` — bez tog drugog kriterijuma bi se
 * redosled menjao između build-ova i pravio razlike u HTML-u niotkuda.
 */
function poBrojuPaNazivu(
  a: { count: number; label: string },
  b: { count: number; label: string },
): number {
  return b.count - a.count || a.label.localeCompare(b.label, "sr");
}

/**
 * Sve što se gradi jednom, pri prvom dodiru kataloga.
 *
 * Indeksi (a ne `filter` po pozivu) postoje zbog build-a: strana modela ima
 * 1.367, a strana model × vrsta 1.823 — sa `all.filter(...)` bi svaka od njih
 * prošla kroz svih 35.901 artikal, što je preko 110 miliona poređenja samo za
 * render, plus još toliko za `generateMetadata`. Ovako je to jedan prolaz kroz
 * katalog pri prvom pozivu, a svaka strana posle toga radi `Map.get`.
 */
let cache: {
  all: Product[];
  byId: Map<string, Product>;
  bySlug: Map<string, Product>;
  poTipu: Map<string, Product[]>;
  poBrendu: Map<string, Product[]>;
  poModelu: Map<string, Product[]>;
  /** Ključ je `komboKljuc(modelKey, tipKey)`. */
  poModeluITipu: Map<string, Product[]>;
  /** Svi kanonski modeli iz rečnika, i oni bez ijednog artikla (count 0). */
  modeli: Map<string, ModelInfo>;
  /** Modeli jedne marke, već sortirani — vidi `modelsByBrand`. */
  modeliPoBrendu: Map<string, ModelInfo[]>;
} | null = null;

function build() {
  if (cache) return cache;

  const tables = packed as unknown as PackedCatalog;
  const at = (table: { key: string; label: string }[], i: number) =>
    i >= 0 ? table[i] : undefined;

  const all: Product[] = tables.items.map(([id, name, price, image, t, b, m]) => {
    const type = at(tables.types, t);
    const brand = at(tables.brands, b);
    const model = m >= 0 ? tables.models[m] : undefined;
    return {
      id,
      slug: productSlug(name, id),
      name,
      price,
      ...(image ? { image } : {}),
      typeKey: type?.key ?? "ostalo",
      typeLabel: type?.label ?? "Ostalo",
      ...(brand ? { brandKey: brand.key, brandLabel: brand.label } : {}),
      ...(model ? { modelKey: model.key, modelLabel: model.label } : {}),
    };
  });

  const byId = new Map<string, Product>();
  const bySlug = new Map<string, Product>();
  const poTipu = new Map<string, Product[]>();
  const poBrendu = new Map<string, Product[]>();
  const poModelu = new Map<string, Product[]>();
  const poModeluITipu = new Map<string, Product[]>();

  const dodaj = (mapa: Map<string, Product[]>, kljuc: string, p: Product) => {
    const lista = mapa.get(kljuc);
    if (lista) lista.push(p);
    else mapa.set(kljuc, [p]);
  };

  for (const p of all) {
    byId.set(p.id, p);
    bySlug.set(p.slug, p);
    dodaj(poTipu, p.typeKey, p);
    if (p.brandKey) dodaj(poBrendu, p.brandKey, p);
    if (p.modelKey) {
      dodaj(poModelu, p.modelKey, p);
      dodaj(poModeluITipu, komboKljuc(p.modelKey, p.typeKey), p);
    }
  }

  // Marka modela se čita iz tabele modela (`brand`), a ne sa artikla: tako je
  // veza model → marka jedna i ista za sve artikle tog modela, pa i URL
  // `/za-telefon/<brend>/<model>` ima tačno jedan ispravan oblik.
  const modeli = new Map<string, ModelInfo>();
  for (const m of tables.models) {
    const marka = tables.brands.find((b) => b.key === m.brand);
    modeli.set(m.key, {
      key: m.key,
      label: m.label,
      brandKey: m.brand,
      brandLabel: marka?.label ?? m.brand,
      count: poModelu.get(m.key)?.length ?? 0,
    });
  }

  // Modeli bez ijednog artikla se ne upisuju: rečnik `scripts/modeli-dictionary.mjs`
  // je širi od zaliha, a strana „Sve za X" bez artikla je prazna strana u indeksu.
  const modeliPoBrendu = new Map<string, ModelInfo[]>();
  for (const m of modeli.values()) {
    if (m.count === 0) continue;
    const lista = modeliPoBrendu.get(m.brandKey);
    if (lista) lista.push(m);
    else modeliPoBrendu.set(m.brandKey, [m]);
  }
  for (const lista of modeliPoBrendu.values()) lista.sort(poBrojuPaNazivu);

  cache = {
    all,
    byId,
    bySlug,
    poTipu,
    poBrendu,
    poModelu,
    poModeluITipu,
    modeli,
    modeliPoBrendu,
  };
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
 * Adresa fotografije kod dobavljača — po slug-u, BEZ građenja celog kataloga.
 *
 * Služi samo `/slika/[slug]` ruti (vidi `src/app/slika/[slug]/route.ts`), koja
 * se poziva jednom po fotografiji i mora da bude jeftina pri hladnom startu:
 * `build()` bi za jedan jedini upit napravio 35.901 objekat sa slug-om, dok
 * ovde ide plitka mapa `id → adresa` nad već raspakovanim redovima.
 *
 * Traži ISKLJUČIVO po kataloškom kodu iz slug-a. To nije prečica nego zaštita:
 * ruta prima adresu iz spoljnog sveta i po njoj radi mrežni zahtev, pa sme da
 * dohvati samo ono što stoji u našem katalogu (bez ovoga bi bila otvoreni
 * proxy — SSRF).
 */
let slikePoId: Map<string, string> | null = null;

export function slikaPoSlugu(slug: string): string | undefined {
  const id = idFromSlug(slug);
  if (!id) return undefined;

  if (!slikePoId) {
    const tables = packed as unknown as PackedCatalog;
    slikePoId = new Map();
    for (const [itemId, , , image] of tables.items) {
      if (image) slikePoId.set(itemId, image);
    }
  }
  return slikePoId.get(id);
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
    if (o.modelKey && p.modelKey && o.modelKey === p.modelKey) s += 4;
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
  const zaModel = p.modelLabel
    ? ` Odgovara modelu ${p.modelLabel}.`
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
  return [...mapa.values()].sort(poBrojuPaNazivu);
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

/** Kanonski modeli telefona za koje postoji oprema. */
export function productModels(): Kategorija[] {
  return prebroj(getAllProducts(), (p) => p.modelKey, (p) => p.modelLabel);
}

/*
 * Tri pretrage ispod su nekad bile `all.filter(...)` — svaka je čitala svih
 * 35.901 artikal. Sada čitaju indekse iz `build()`, ali vraćaju KOPIJU liste:
 * pozivaoci (`zaVitrinu`, `grupePoVrsti`, `pretrazi`) smeju da sortiraju i seku
 * ono što dobiju, a keš ne sme da im se promeni pod rukom. Kopija niza
 * referenci je i dalje red veličine jeftinija od prolaska kroz ceo katalog.
 */

export const getProductsByType = (typeKey: string) =>
  [...(build().poTipu.get(typeKey) ?? [])];

export const getProductsByModel = (modelKey: string) =>
  [...(build().poModelu.get(modelKey) ?? [])];

export const getProductsByBrand = (brandKey: string) =>
  [...(build().poBrendu.get(brandKey) ?? [])];

/** Opis kategorijske stranice — dopunjava tekst iz `lib/data.ts` brojem artikala. */
export function typeDescription(typeKey: string): string {
  const cat = categories.find((c) => c.key === typeKey);
  return cat?.description ?? "Artikli iz naše ponude opreme za mobilne telefone.";
}

/* --------------------------- Model telefona -------------------------------- */

/**
 * Sloj modela postoji zbog jedne rečenice vlasnika: „da kad neko pretraži deo
 * za taj i taj telefon, izađe naš sajt i dovede ga do tog dela".
 *
 * Ljudi ne kucaju „maske Samsung" nego „maska za S23 Ultra". Strana marke je za
 * to pregruba (Samsung ima preko trinaest hiljada artikala), a `/prodavnica` sa
 * filterima nosi `noindex`. Zato model dobija svoje strane:
 *
 *   /za-telefon/<brend>/<model>         „Sve za Galaxy S23"
 *   /za-telefon/<brend>/<model>/<tip>   „Ekrani za Galaxy S23"
 *
 * Sve funkcije ispod čitaju indekse iz `build()`, pa ih `generateStaticParams`
 * i 3.190 strana smeju zvati koliko god puta.
 */

export type ModelInfo = {
  /** Kanonski slug modela („galaxy-s23"), jedinstven u celom katalogu. */
  key: string;
  /** Naziv za prikaz („Galaxy S23"). */
  label: string;
  /** Marka kojoj model pripada — prvi segment URL-a modela. */
  brandKey: string;
  brandLabel: string;
  /** Broj artikala za taj model, kroz sve vrste. */
  count: number;
};

/** Podaci o jednom modelu; `undefined` za ključ koji nije u katalogu (→ 404). */
export function getModel(modelKey: string): ModelInfo | undefined {
  return build().modeli.get(modelKey);
}

/**
 * Modeli jedne marke — najzastupljeniji prvi, pa abecedno.
 *
 * Redosled je bitan za stranu marke: Samsung ima preko dvesta modela, a kupca
 * zanima da mu na vrhu budu oni za koje stvarno imamo asortiman. Modeli bez
 * ijednog artikla se ne vraćaju (za njih ni ne pravimo stranu).
 */
export function modelsByBrand(brandKey: string): ModelInfo[] {
  return [...(build().modeliPoBrendu.get(brandKey) ?? [])];
}

/** Artikli jedne vrste za jedan model — sadržaj strane „Ekrani za Galaxy S23". */
export function getProductsByModelAndType(modelKey: string, tipKey: string): Product[] {
  return [...(build().poModeluITipu.get(komboKljuc(modelKey, tipKey)) ?? [])];
}

/**
 * Vrste artikala koje za taj model postoje, sa brojem — police na strani modela
 * i izvor linkova ka `/za-telefon/<brend>/<model>/<tip>`.
 *
 * `count` je broj artikala TE VRSTE za TAJ model (npr. 41 maska za S23), a ne
 * ukupan broj za vrstu ili za model.
 */
export function tipoviZaModel(modelKey: string): Kategorija[] {
  const artikli = build().poModelu.get(modelKey);
  if (!artikli) return [];
  return prebroj(artikli, (p) => p.typeKey, (p) => p.typeLabel);
}

/**
 * Koliko artikala mora da postoji da bi kombinacija model × vrsta dobila svoju
 * stranu.
 *
 * Kombinacija ima 3.744; sa jednim ili dva artikla to su tanke strane koje
 * Google i sam svrstava u „Crawled – currently not indexed", a nama razblažuju
 * ostatak sajta. Prag od tri ostavlja 1.823 strane koje stvarno izgledaju kao
 * ponuda. Kombinacije ispod praga nisu izgubljene: njihovi artikli i dalje stoje
 * na strani modela („Sve za …"), koja se pravi za svaki model.
 */
export const PRAG_ZA_TIP_STRANU = 3;

/**
 * Parametri za `generateStaticParams` strane modela — svi modeli sa bar jednim
 * artiklom. Redosled je stabilan (marka, pa broj artikala) da se spisak strana
 * ne premeće između build-ova.
 */
export function modelParams(): { brend: string; model: string }[] {
  const { modeliPoBrendu } = build();
  return [...modeliPoBrendu.keys()]
    .sort((a, b) => a.localeCompare(b, "sr"))
    .flatMap((brandKey) =>
      (modeliPoBrendu.get(brandKey) ?? []).map((m) => ({
        brend: m.brandKey,
        model: m.key,
      })),
    );
}

/**
 * Parametri za `generateStaticParams` strane model × vrsta — samo kombinacije
 * sa bar `PRAG_ZA_TIP_STRANU` artikala.
 *
 * Ruta zato treba `dynamicParams = false`: sve ispod praga mora da bude 404, a
 * ne prazna strana koja bi se generisala na zahtev.
 */
export function modelTipParams(): { brend: string; model: string; tip: string }[] {
  const { poModeluITipu } = build();
  const params: { brend: string; model: string; tip: string }[] = [];

  for (const { brend, model } of modelParams()) {
    for (const tip of tipoviZaModel(model)) {
      const artikli = poModeluITipu.get(komboKljuc(model, tip.key));
      if (!artikli || artikli.length < PRAG_ZA_TIP_STRANU) continue;
      params.push({ brend, model, tip: tip.key });
    }
  }
  return params;
}

/**
 * Najzastupljeniji modeli unutar jedne vrste artikla — za interne linkove sa
 * kategorijske strane („Maske za: iPhone 15, Galaxy S23, Redmi Note 12…").
 *
 * `count` u rezultatu je broj artikala TE VRSTE za taj model, jer se upravo taj
 * broj i prikazuje uz link. Vraćaju se samo modeli iznad praga — link ka strani
 * koja se ne generiše bio bi 404.
 */
export function popularniModeliZaTip(tipKey: string, limit: number): ModelInfo[] {
  const { modeli, poModeluITipu } = build();
  const nadjeni: ModelInfo[] = [];

  for (const [kljuc, artikli] of poModeluITipu) {
    if (artikli.length < PRAG_ZA_TIP_STRANU) continue;
    const granica = kljuc.lastIndexOf("|");
    if (kljuc.slice(granica + 1) !== tipKey) continue;
    const info = modeli.get(kljuc.slice(0, granica));
    if (info) nadjeni.push({ ...info, count: artikli.length });
  }

  return nadjeni.sort(poBrojuPaNazivu).slice(0, limit);
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
