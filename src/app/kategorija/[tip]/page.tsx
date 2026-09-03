import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Wrench } from "lucide-react";
import { FilterKontrole } from "@/components/FilterKontrole";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { Paginacija } from "@/components/Paginacija";
import { PraznoStanje } from "@/components/PraznoStanje";
import { ProizvodKartica } from "@/components/ProizvodKartica";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { brendHref, kategorijaHref, prodavnicaHref } from "@/lib/catalog";
import { categories } from "@/lib/data";
import {
  getProductsByType,
  productTypes,
  typeDescription,
  type Product,
} from "@/lib/products";
import { PO_STRANI, parseUpit, pretrazi } from "@/lib/shop-query";
import { site } from "@/lib/site";

/**
 * Kategorijska strana — jedna vrsta artikla (maske, stakla, baterije…).
 *
 * Ovo je KANONSKA, indeksabilna strana za pretrage tipa „zaštitno staklo Novi
 * Sad" — ali samo u podrazumevanom, nefiltriranom obliku (vidi `generateMetadata`).
 * Isti `FilterKontrole` kao na `/prodavnica` radi i ovde, samo bez fasete „tip"
 * (nju već nosi ruta) i sa `osnova` ograničenom na ovu vrstu artikla — kupac
 * sme da suzi po marki/modelu/ceni a da ne napusti kategoriju. Čim korisnik
 * doda filter, strana se ponaša kao `/prodavnica` (paginacija, `noindex`);
 * podrazumevani prikaz ostaje statična vitrina sa linkovima ka artiklima i
 * stranama brendova, kao i do sada.
 */

/* Svi ključevi dolaze iz kataloga — nepoznata vrsta je 404, ne prazna strana. */
export const dynamicParams = false;

export function generateStaticParams() {
  return productTypes().map((t) => ({ tip: t.key }));
}

/* -------------------------------- Pomoćno --------------------------------- */

/**
 * Koliko artikala ide u vitrinu kad NIJEDAN filter nije aktivan.
 *
 * Čim korisnik doda filter (ili ode na stranu 2+), vitrina ustupa mesto punoj,
 * paginiranoj listi iz `pretrazi()` — ista mehanika kao `/prodavnica`, samo nad
 * `osnova` ograničenom na ovu vrstu artikla. Podrazumevani, nefiltrirani prikaz
 * ostaje statična vitrina: to je jedini oblik ove strane koji sme u indeks (vidi
 * `generateMetadata`), pa 48 kartica ostaje dovoljno da Google dobije interne
 * linkove ka artiklima bez ponovnog generisanja onoga što `/katalog/[strana]`
 * već radi statički.
 */
const U_VITRINI = 48;

/** Vrste artikala kod kojih posle kupovine sledi rad u servisu. */
const UZ_UGRADNJU = ["ekrani", "baterije", "delovi", "stakla"];

const broj = (n: number) => n.toLocaleString("sr-RS");

/**
 * Srpski ima tri oblika množine, a kategorije idu od 4 do 9.247 artikala — bez
 * ovoga bi na strani pisalo „4 artikala". (Isti helper je i na strani brenda;
 * zatreba li trećoj strani, seli se u `src/lib`.)
 */
function artikala(n: number): string {
  const jedinice = n % 10;
  const desetice = n % 100;
  if (jedinice === 1 && desetice !== 11) return "artikal";
  if (jedinice >= 2 && jedinice <= 4 && (desetice < 12 || desetice > 14)) return "artikla";
  return "artikala";
}

/**
 * Prvih N za vitrinu: artikli sa fotografijom idu prvi — placeholder ploča
 * („Fotografija uskoro") ne prodaje ništa, a prvi ekran je ono što kupac vidi.
 * Unutar toga abecedno, da redosled bude isti u svakom build-u.
 */
function zaVitrinu(items: Product[], limit: number): Product[] {
  return [...items]
    .sort((a, b) => {
      const slika = Number(Boolean(b.image)) - Number(Boolean(a.image));
      return slika !== 0 ? slika : a.name.localeCompare(b.name, "sr");
    })
    .slice(0, limit);
}

type Brend = { key: string; label: string; count: number };

/**
 * Brendovi telefona zastupljeni u ovoj kategoriji.
 *
 * „univerzalno" se izostavlja jer za njega ne postoji `/za-telefon/univerzalno`
 * — `productBrands()` ga ne generiše, pa bi chip vodio na 404.
 */
function brendoviUKategoriji(items: Product[]): Brend[] {
  const mapa = new Map<string, Brend>();
  for (const p of items) {
    if (!p.brandKey || p.brandKey === "univerzalno") continue;
    const postojeci = mapa.get(p.brandKey);
    if (postojeci) postojeci.count += 1;
    else mapa.set(p.brandKey, { key: p.brandKey, label: p.brandLabel ?? p.brandKey, count: 1 });
  }
  return [...mapa.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, "sr"),
  );
}

type SearchParams = Record<string, string | string[] | undefined>;

/** Upit iz URL-a, ali BEZ fasete „tip" — nju na ovoj ruti već nosi `params.tip`. */
function upitZaKategoriju(searchParams: SearchParams) {
  const upit = parseUpit(searchParams);
  return { ...upit, izbor: { ...upit.izbor, tip: [] } };
}

/** Aktivan filter, pretraga ili strana ≠ 1 — određuje i `robots`, i koji se prikaz renderuje. */
function jeFiltrirano(upit: ReturnType<typeof upitZaKategoriju>): boolean {
  return Object.values(upit.izbor).flat().length > 0 || upit.q !== "" || upit.strana > 1;
}

/* -------------------------------- Metadata -------------------------------- */

// Kad strana deklariše `openGraph`, roditeljski iz `layout.tsx` se ne nasleđuje
// — zato se slika ponavlja ovde (drugog OG vizuala i nemamo).
const OG_IMAGE = "/images/brend/logo.jpg";

export function generateMetadata({
  params,
  searchParams,
}: {
  params: { tip: string };
  searchParams: SearchParams;
}): Metadata {
  const kat = productTypes().find((t) => t.key === params.tip);
  if (!kat) return {};

  const canonical = kategorijaHref(kat.key);
  const title = `${kat.label} za mobilne telefone — Novi Sad`;
  const description = `${typeDescription(kat.key)} ${broj(kat.count)} ${artikala(kat.count)} sa cenama u dinarima — ${site.name}, ${site.address.city}.`;

  // Filtrirani prikaz (marka/model/cena, pretraga, strana 2+) ne sme u indeks —
  // kombinacija faseta daje na hiljade URL-ova sa istim artiklima, isto kao na
  // `/prodavnica`. Canonical i dalje pokazuje na čistu kategoriju.
  const filtrirano = jeFiltrirano(upitZaKategoriju(searchParams));

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: !filtrirano, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${kat.label} | ${site.name}`,
      description,
      images: [{ url: OG_IMAGE, alt: `${site.name} — ${site.slogan}` }],
    },
  };
}

/* -------------------------------- Stranica -------------------------------- */

export default function KategorijaPage({
  params,
  searchParams,
}: {
  params: { tip: string };
  searchParams: SearchParams;
}) {
  const kat = productTypes().find((t) => t.key === params.tip);
  if (!kat) notFound();

  const svi = getProductsByType(kat.key);
  const vitrina = zaVitrinu(svi, U_VITRINI);
  const ostalo = svi.length - vitrina.length;
  const brendovi = brendoviUKategoriji(svi);
  // Veliko početno slovo je obavezno: `<ikonica />` bi JSX shvatio kao HTML tag
  // („<ikonica>"), a ne kao komponentu iz `lib/data`.
  const Ikonica = categories.find((c) => c.key === kat.key)?.icon;
  const ostaleKategorije = productTypes().filter((t) => t.key !== kat.key);

  // Isti filter/sort/pretraga kao na `/prodavnica`, ali nad `svi` (samo ova
  // vrsta) i bez fasete „tip" — vidi `FilterKontrole` i komentar uz `U_VITRINI`.
  const upit = upitZaKategoriju(searchParams);
  const filtrirano = jeFiltrirano(upit);
  const {
    strana: filtriraniItemi,
    ukupno: ukupnoFiltrirano,
    brojStrana,
    tekucaStrana,
    fasete,
  } = pretrazi(upit, svi);
  const faseteBezTipa = fasete.filter((f) => f.def.key !== "tip");
  const prviFiltrirani = (tekucaStrana - 1) * PO_STRANI + 1;
  const poslednjiFiltrirani = prviFiltrirani + filtriraniItemi.length - 1;

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: kat.label, href: kategorijaHref(kat.key) },
        ]}
      />

      <PageHeader
        eyebrow={`${broj(kat.count)} ${artikala(kat.count)} u ponudi`}
        title={kat.label}
        description={typeDescription(kat.key)}
      />

      <section className="section pt-10 md:pt-12">
        <div className="container">
          {/* Vidljiva putanja (JSON-LD verzija je gore) — na dubokim stranama
              kupac mora da zna gde je i kako da se vrati u celu prodavnicu. */}
          <nav aria-label="Putanja" className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-brand-400">Početna</Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <Link href="/prodavnica" className="transition-colors hover:text-brand-400">Prodavnica</Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <span className="font-medium text-cream">{kat.label}</span>
          </nav>

          {/* Kontakt ispod putanje: kupac koji ne nađe svoj model
              ne treba da skroluje 48 kartica do dugmadi. Bez `naziv`
              — na kategoriji nema jednog artikla, a predpopunjeno „da li je
              dostupno?" za celu kategoriju bi vlasniku stiglo kao besmislica.
              Konkretan upit ide sa kartice. */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex items-start gap-3">
              {Ikonica ? (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-600 bg-ink-700 text-brand-400">
                  <Ikonica className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
              ) : null}
              <div>
                <p className="font-semibold text-cream">Ne vidite svoj model?</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Pišite nam model telefona — imamo i ono što nije na sajtu, a odgovaramo isti dan.
                </p>
              </div>
            </div>
            <KontaktDugmad className="shrink-0" />
          </div>

          {UZ_UGRADNJU.includes(kat.key) ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2.5 text-sm text-cream/85">
                <Wrench aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                Ugradnju i zamenu radimo u našem servisu — {site.address.street}, {site.address.city}.
              </p>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/servis">Usluge servisa</Link>
              </Button>
            </div>
          ) : null}

          {/* Isti filter/sort/pretraga kao na `/prodavnica`, samo bez fasete
              „tip" (nju već nosi ova ruta) i nad artiklima iz ove kategorije. */}
          <div className="mt-8">
            <FilterKontrole
              fasete={faseteBezTipa}
              izbor={upit.izbor}
              q={upit.q}
              sort={upit.sort}
              ukupno={ukupnoFiltrirano}
              basePath={kategorijaHref(kat.key)}
            />
          </div>

          {filtrirano ? (
            ukupnoFiltrirano > 0 ? (
              <>
                <p className="mt-6 text-sm text-muted-foreground">
                  Prikazano{" "}
                  <span className="font-semibold text-cream">
                    {broj(prviFiltrirani)}–{broj(poslednjiFiltrirani)}
                  </span>{" "}
                  od <span className="font-semibold text-cream">{broj(ukupnoFiltrirano)}</span>{" "}
                  {artikala(ukupnoFiltrirano)}
                  {brojStrana > 1 ? (
                    <>
                      {" "}
                      · strana {tekucaStrana} od {brojStrana}
                    </>
                  ) : null}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                  {filtriraniItemi.map((item) => (
                    <ProizvodKartica key={item.id} item={item} />
                  ))}
                </div>

                <Paginacija
                  upit={upit}
                  tekuca={tekucaStrana}
                  strana={brojStrana}
                  basePath={kategorijaHref(kat.key)}
                />
              </>
            ) : (
              <PraznoStanje />
            )
          ) : (
            <>
              {/* Kartice nisu pojedinačno u `Reveal`: 48 framer instanci na strani
                  je skuplje od efekta koji donose. Animiraju se zaglavlja blokova. */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {vitrina.map((item) => (
                  <ProizvodKartica key={item.id} item={item} />
                ))}
              </div>

              {ostalo > 0 ? (
                <Reveal className="mt-10">
                  <div className="flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-cream">
                        Još {broj(ostalo)} {artikala(ostalo)} u ovoj kategoriji
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        U prodavnici možete filtrirati po telefonu i ceni ili pretražiti po tačnom modelu.
                      </p>
                    </div>
                    <Button asChild size="md" className="shrink-0">
                      <Link href={prodavnicaHref({ tip: kat.key })}>
                        Prikaži sve
                        <ArrowRight aria-hidden className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Reveal>
              ) : null}
            </>
          )}
        </div>
      </section>

      {brendovi.length > 0 ? (
        <section className="section border-t border-ink-600 bg-ink-800/40">
          <div className="container">
            <SectionHeading
              eyebrow="Za koji telefon"
              title={`${kat.label} po brendu telefona`}
              description="Broj pored brenda je za ovu kategoriju; strana brenda pokriva svu opremu i sve delove za taj telefon."
            />

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {brendovi.map((b) => (
                <Link
                  key={b.key}
                  href={brendHref(b.key)}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-ink-700"
                >
                  <span className="truncate text-sm font-semibold text-cream transition-colors group-hover:text-brand-400">
                    {b.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-ink-700 px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums text-muted-foreground group-hover:bg-ink">
                    {broj(b.count)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="section">
        <div className="container">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Ostale kategorije
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {ostaleKategorije.map((t) => (
              <Link
                key={t.key}
                href={kategorijaHref(t.key)}
                className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
              >
                {t.label}
                <span className="text-[0.7rem] tabular-nums text-muted-foreground">{broj(t.count)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
