import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { Cena } from "@/components/Cena";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { ProductThumb } from "@/components/ProductThumb";
import { ProizvodKartica } from "@/components/ProizvodKartica";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { brendHref, kategorijaHref, modelHref, modelTipHref } from "@/lib/catalog";
import { altSlike } from "@/lib/opis-slike";
import { formatRsd, imaCenu } from "@/lib/pricing";
import { site, SITE_URL } from "@/lib/site";
import { nasaSlika } from "@/lib/slike";
import { cn } from "@/lib/utils";
import {
  getModel,
  getProductBySlug,
  getProductsByModelAndType,
  productDescription,
  productHighlights,
  relatedProducts,
  staticProductParams,
  PRAG_ZA_TIP_STRANU,
  type ModelInfo,
  type Product,
} from "@/lib/products";

/**
 * Stranica jednog artikla — cena, pa načini kontakta, pa opis.
 *
 * Redosled nije estetski nego poslovni: nema korpe ni checkout-a, pa je
 * dugmad za Viber/WhatsApp/Instagram/telefon jedini put do kupovine i mora
 * da stoji odmah pod cenom, pre bilo kog opisnog teksta.
 */

/** Slika koja ide u OG kad artikal nema fotografiju (isti fallback kao layout). */
const OG_FALLBACK = "/images/brend/logo.jpg";

/**
 * Katalog ima blizu 36.000 artikala. Kad bi se sve strane pravile u build-u,
 * `next build` bi trajao satima i izbacio desetine hiljada HTML fajlova — a
 * ogroman deo tih strana (maske za modele koji se retko traže) nikad ne bi bio
 * otvoren.
 *
 * Zato se u build-u prave samo strane do kojih se stiže sa sajta (vidi
 * `staticProductParams`), a ostale se generišu pri prvom otvaranju i keširaju.
 * `dynamicParams = true` je uslov za to; nepoznat slug i dalje ide na 404 jer
 * `getProductBySlug` vrati `undefined` pa strana zove `notFound()`.
 */
export const dynamicParams = true;

/** Strana generisana na zahtev se osvežava jednom dnevno. */
export const revalidate = 86400;

export function generateStaticParams() {
  return staticProductParams();
}

/* ------------------------------- Pomoćno ---------------------------------- */

const abs = (path: string) => `${SITE_URL}${path}`;

const putanjaProizvoda = (p: Product) => `/proizvod/${p.slug}`;

/** Brend ima smisla prikazati samo kad je stvarni proizvođač telefona. */
const imaBrend = (p: Product): p is Product & { brandKey: string; brandLabel: string } =>
  Boolean(p.brandKey && p.brandLabel && p.brandKey !== "univerzalno");

/**
 * Model artikla iz kataloga — `undefined` kad artikal nije vezan ni za jedan
 * (univerzalna oprema, alat) ili kad ključ ispadne iz kataloga posle osvežavanja.
 *
 * Ne koristi se `p.modelLabel` za linkove: adresa strane modela počinje markom,
 * a marku modela kanonski zna samo `getModel()` — `p.brandKey` je marka ARTIKLA
 * i za tuđi URL nije garancija.
 */
const modelArtikla = (p: Product): ModelInfo | undefined =>
  p.modelKey ? getModel(p.modelKey) : undefined;

/**
 * Ima li model svoju stranu po vrsti („Ekrani za Galaxy S23").
 *
 * Prave se samo kombinacije sa bar `PRAG_ZA_TIP_STRANU` artikala, pa link ka
 * kombinaciji ispod praga ne bi bio tanka strana nego 404.
 */
const imaStranuVrste = (p: Product, model: ModelInfo): boolean =>
  getProductsByModelAndType(model.key, p.typeKey).length >= PRAG_ZA_TIP_STRANU;

/**
 * Google u rezultatu odseca opis na oko 160 znakova. Odsecamo sami i to na
 * granici reči — presečena reč u SERP-u izgleda kao greška na sajtu.
 */
function skrati(tekst: string, max = 158): string {
  if (tekst.length <= max) return tekst;
  const rez = tekst.slice(0, max);
  const razmak = rez.lastIndexOf(" ");
  return `${(razmak > 40 ? rez.slice(0, razmak) : rez).replace(/[\s,.;:–-]+$/, "")}…`;
}

/**
 * Opis za pretraživače. Uvod je zajednički za celu vrstu artikla, pa
 * jedinstvenost strane nose cena i model — bez njih bi hiljade artikala imale
 * isti meta opis.
 */
const opisZaPretragu = (p: Product) =>
  skrati(
    `${imaCenu(p.price) ? `Cena ${formatRsd(p.price)}. ` : ""}${productDescription(p)}`,
  );

/* ------------------------------- Metadata --------------------------------- */

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const p = getProductBySlug(params.slug);
  if (!p) return {};

  // Kanonska adresa je uvek `p.slug`: `getProductBySlug` prihvata i stariji
  // slug (traži po kataloškom kodu), pa dve adrese mogu voditi na isti artikal.
  const canonical = putanjaProizvoda(p);
  const title = `${p.name} — cena i dostupnost`;
  const description = opisZaPretragu(p);

  return {
    title,
    description,
    alternates: { canonical },
    keywords: [
      p.name,
      p.typeLabel,
      p.modelLabel ?? "",
      imaBrend(p) ? p.brandLabel : "",
      `${p.typeLabel} ${site.city}`,
      site.name,
    ].filter(Boolean),
    openGraph: {
      // schema tipa „product" nema u Next OG tipovima — „website" je jedini
      // ispravan izbor i ne menja ništa u prikazu kartice.
      type: "website",
      url: abs(canonical),
      title: `${p.name} | ${site.name}`,
      description,
      // Slika ide sa NAŠEG domena, preko `/slika/[slug]`, a ne punom adresom
      // dobavljača iz kataloga: OG karticu koja pokazuje na tuđi host pola
      // mreža (Viber, WhatsApp, Facebook) ne prikaže, a i kad je prikaže,
      // pregled naše strane vuče sliku sa servera nad kojim nemamo kontrolu.
      // Adresa je apsolutna jer OG čitači ne razrešavaju relativne putanje.
      images: [{ url: abs(p.image ? nasaSlika(p.slug) : OG_FALLBACK), alt: altSlike(p) }],
    },
  };
}

/* ------------------------------- JSON-LD ---------------------------------- */

/**
 * Do kada ponuda važi (`priceValidUntil`).
 *
 * Google to polje traži uz cenu; bez njega Search Console prijavljuje
 * upozorenje na svakom artiklu, a stariju ponudu ume da prikaže bez cene.
 * Datum se računa u build-u, godinu dana unapred: cenovnik se osvežava sa
 * svakim `npm run katalog` + deploy-om, pa se granica pomera zajedno sa njim i
 * nikad ne ostane u prošlosti.
 */
const CENA_VAZI_DO = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);

function ProizvodJsonLd({ p }: { p: Product }) {
  const url = abs(putanjaProizvoda(p));

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: productDescription(p),
    category: p.typeLabel,
    sku: p.id,
    // Slika ulazi u strukturirane podatke samo kad postoji prava fotografija —
    // brendiran placeholder u Google rezultatu ne govori ništa o artiklu.
    //
    // Prijavljuje se NAŠA adresa (`/slika/[slug]`), ista ona koja stoji u
    // `/image-sitemap.xml` i u `<img>` na strani. Da ovde stoji adresa
    // dobavljača, Google bi za isti artikal video tri različite slike i nijednu
    // ne bi vezao za našu stranu — a ceo posao oko Google slika je u toj vezi.
    ...(p.image ? { image: [abs(nasaSlika(p.slug))] } : {}),
    ...(imaBrend(p) ? { brand: { "@type": "Brand", name: p.brandLabel } } : {}),
    url,
    offers: {
      "@type": "Offer",
      url,
      // Dostupnost svakako potvrđujemo u poruci pre slanja, pa je „InStock"
      // tačniji od „PreOrder" — artikli su iz redovnog asortimana radnje.
      availability: "https://schema.org/InStock",
      // Sve iz kataloga je novo i nekorišćeno — bez ove oznake Google pretpostavlja
      // ali i prijavljuje upozorenje da nedostaje.
      itemCondition: "https://schema.org/NewCondition",
      /*
       * Cena ide u ponudu samo kad je stvarno u katalogu. Za artikal bez cene
       * se izostavlja i `priceCurrency`: valuta bez broja je za Google
       * nepotpuna ponuda (upozorenje u Search Console-u), a izmišljen broj bi
       * bio gore od nijednog.
       */
      ...(imaCenu(p.price)
        ? { price: p.price, priceCurrency: "RSD", priceValidUntil: CENA_VAZI_DO }
        : {}),
      seller: { "@type": "Organization", name: site.name },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* -------------------------------- Stranica -------------------------------- */

export default function ProizvodPage({ params }: { params: { slug: string } }) {
  const p = getProductBySlug(params.slug);
  if (!p) notFound();

  // Ista formatirana cena ide i u prikaz i u predpopunjenu poruku, da kupac i
  // vlasnik gledaju isti broj.
  const cena = imaCenu(p.price) ? formatRsd(p.price) : undefined;

  return (
    <>
      <ProizvodJsonLd p={p} />
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: p.typeLabel, href: kategorijaHref(p.typeKey) },
          { naziv: p.name, href: putanjaProizvoda(p) },
        ]}
      />

      {/*
        Sadržaj se ne animira pri ulasku: ovo je glavni sadržaj strane (i LCP),
        a `Reveal` bi ga na trenutak držao providnim. Animacija ostaje za
        sekcije koje korisnik doskroluje.
      */}
      <article className="pb-16 pt-28 md:pt-32">
        <div className="container">
          <Putanja p={p} />

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-12">
            {/* Vizual */}
            <div className="overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card lg:sticky lg:top-28 lg:self-start">
              <ProductThumb
                artikal={p}
                // Ovde se slika gleda izbliza, pa se od izvora traži najveća
                // varijanta (vidi src/lib/slike.ts); uz nju se ispisuje i
                // kataloški kod kad fotografije nema.
                kadar="detalj"
                sizes="(max-width: 1024px) 100vw, 44vw"
                priority
                // Kvadrat: sličice dobavljača su uglavnom kvadratne, a i
                // placeholder na kvadratu izgleda kao namerna ploča.
                className="aspect-square w-full"
              />
            </div>

            {/* Podaci */}
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-2">
                <Oznaka href={kategorijaHref(p.typeKey)}>{p.typeLabel}</Oznaka>
                {imaBrend(p) ? (
                  <Oznaka href={brendHref(p.brandKey)} tiho>
                    {p.brandLabel}
                  </Oznaka>
                ) : null}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold leading-[1.1] tracking-[-0.02em] text-balance text-cream md:text-4xl">
                {p.name}
              </h1>

              <ModelRed p={p} />

              {/* Cena i kanali kontakta — jedini način naručivanja. */}
              <div className="mt-6 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card">
                <Cena rsd={p.price} size="lg" />

                <p className="mt-4 text-sm font-medium text-cream/80">
                  {cena
                    ? "Poručite porukom ili pozivom:"
                    : "Javite se za cenu i dostupnost:"}
                </p>

                <KontaktDugmad
                  naziv={p.name}
                  cena={cena}
                  layout="red"
                  className="mt-3"
                />

                <p className="mt-4 text-[0.8rem] leading-relaxed text-muted-foreground">
                  Nema korpe ni narudžbenice — dostupnost i konačnu cenu
                  potvrđujemo u poruci pre slanja. Drugi broj:{" "}
                  <a
                    href={site.telAltHref}
                    className="font-medium text-brand-400 hover:underline"
                  >
                    {site.phoneAltDisplay}
                  </a>
                  .
                </p>
              </div>

              <p className="mt-6 leading-relaxed text-cream/75">
                {productDescription(p)}
              </p>

              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {productHighlights(p).map((stavka) => (
                  <li
                    key={stavka}
                    className="flex items-start gap-2 text-sm text-cream/75"
                  >
                    <Check
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                    />
                    {stavka}
                  </li>
                ))}
              </ul>

              <Specifikacije p={p} />
            </div>
          </div>

          <SrodniProizvodi p={p} />
        </div>
      </article>
    </>
  );
}

/* ------------------------------ Podkomponente ----------------------------- */

/** Oznaka iznad naslova; ujedno i interni link na kategoriju/brend. */
function Oznaka({
  href,
  children,
  tiho = false,
}: {
  href: string;
  children: ReactNode;
  tiho?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        tiho
          ? "bg-ink-700 text-cream/70 hover:bg-ink-600 hover:text-cream"
          : "bg-brand/15 text-brand-400 hover:bg-brand/25",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * Red „Model: …" ispod naslova.
 *
 * Kupac je do artikla stigao pretragom po modelu („maska za S23"), pa mu je
 * susedna ponuda za isti telefon prvo sledeće pitanje — zato je model link, a
 * ne samo tekst. Kad model postoji u katalogu ali nema svoju stranu, ostaje
 * običan tekst (isto kao pre): mrtav link je gori od nijednog.
 */
function ModelRed({ p }: { p: Product }) {
  const model = modelArtikla(p);

  if (model) {
    return (
      <p className="mt-3 text-cream/70">
        Model:{" "}
        <Link
          href={modelHref(model.brandKey, model.key)}
          className="font-medium text-brand-400 hover:underline"
        >
          {model.label}
        </Link>
      </p>
    );
  }

  if (!p.modelLabel) return null;

  return (
    <p className="mt-3 text-cream/70">
      Model: <span className="font-medium text-cream">{p.modelLabel}</span>
    </p>
  );
}

function Putanja({ p }: { p: Product }) {
  return (
    <nav
      aria-label="Putanja"
      className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
    >
      <Link href="/" className="hover:text-brand-400">
        Početna
      </Link>
      <ChevronRight aria-hidden className="h-3.5 w-3.5" />
      <Link href="/prodavnica" className="hover:text-brand-400">
        Prodavnica
      </Link>
      <ChevronRight aria-hidden className="h-3.5 w-3.5" />
      <Link href={kategorijaHref(p.typeKey)} className="hover:text-brand-400">
        {p.typeLabel}
      </Link>
      <ChevronRight aria-hidden className="h-3.5 w-3.5" />
      {/* Nazivi artikala su dugi — na mobilnom se skraćuje samo poslednji član. */}
      <span
        aria-current="page"
        className="min-w-0 max-w-full truncate font-medium text-cream"
      >
        {p.name}
      </span>
    </nav>
  );
}

function Specifikacije({ p }: { p: Product }) {
  const model = modelArtikla(p);

  // Vrednost je `ReactNode`, a ne `string`, jer model vodi na svoju stranu —
  // tabela specifikacije je mesto na kom kupac i traži „a šta još imate za ovaj
  // telefon".
  const redModela: [string, ReactNode][] = model
    ? [
        [
          "Model",
          <Link
            key={model.key}
            href={modelHref(model.brandKey, model.key)}
            className="text-brand-400 hover:underline"
          >
            {model.label}
          </Link>,
        ],
      ]
    : p.modelLabel
      ? [["Model", p.modelLabel]]
      : [];

  const redovi: [string, ReactNode][] = [
    ["Kod artikla", p.id],
    ["Vrsta", p.typeLabel],
    ["Za telefon", imaBrend(p) ? p.brandLabel : "Univerzalno / bez oznake"],
    ...redModela,
  ];

  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Specifikacija
      </h2>
      <dl className="mt-3 overflow-hidden rounded-2xl border border-ink-600">
        {redovi.map(([kljuc, vrednost], i) => (
          <div
            key={kljuc}
            className={cn(
              "flex justify-between gap-4 px-4 py-3 text-sm",
              // Naizmenične vrste: na crnoj podlozi tabela bez njih izgleda
              // kao jedan blok teksta.
              i % 2 ? "bg-ink-800/60" : "bg-ink-800",
            )}
          >
            <dt className="text-muted-foreground">{kljuc}</dt>
            <dd className="text-right font-medium text-cream">{vrednost}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SrodniProizvodi({ p }: { p: Product }) {
  const srodni = relatedProducts(p, 4);
  const model = modelArtikla(p);
  if (srodni.length === 0 && !model) return null;

  return (
    <section className="mt-16 border-t border-ink-600 pt-10">
      <h2 className="font-display text-2xl font-bold text-cream">
        Slični artikli
      </h2>
      {srodni.length > 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Iz iste vrste i za isti telefon — sa cenom i kontaktom na kartici.
        </p>
      ) : null}

      {/* Četiri kartice su uzorak; cela ponuda za taj telefon je na strani
          modela. Naziv vrste ne ide u rečenicu („Svi Zaštitna stakla i folije
          za…") nego stoji sam u linku — vrste su raznog roda i broja, pa bi
          svaka duža formulacija razbila slaganje. */}
      {model ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={modelHref(model.brandKey, model.key)}
            className="inline-flex items-center rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
          >
            Sve za {model.label}
          </Link>
          {imaStranuVrste(p, model) ? (
            <Link
              href={modelTipHref(model.brandKey, model.key, p.typeKey)}
              className="inline-flex items-center rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm font-medium text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
            >
              {p.typeLabel} za {model.label}
            </Link>
          ) : null}
        </div>
      ) : null}

      {srodni.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {srodni.map((item) => (
            <ProizvodKartica key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
