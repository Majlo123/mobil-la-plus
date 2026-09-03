import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { ProizvodKartica } from "@/components/ProizvodKartica";
import { FilterKontrole } from "./FilterKontrole";
import { CENOVNI_LABELE, kategorijaHref } from "@/lib/catalog";
import { getAllProducts, productBrands, productTypes } from "@/lib/products";
import {
  PO_STRANI,
  parseUpit,
  pretrazi,
  upitUQuery,
  type Upit,
} from "@/lib/shop-query";

/**
 * Prodavnica — cela je serverska osim kontrola filtera.
 *
 * Stanje filtera stoji u URL-u, pa svaki prikaz ima svoj link, a mreža je u
 * polaznom HTML-u: Googlebot vidi proizvode i cene bez izvršavanja JS-a. Cena
 * ne stoji sama — pod svakom je Viber/WhatsApp/Instagram/telefon, jer korpe
 * nema (vidi `KontaktDugmad`).
 */

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * „1 artikal", „24 artikla", „14.502 artikla" — srpski ima tri oblika množine,
 * a broj pogodaka ovde ide od nule do celog kataloga.
 *
 * Isti helper stoji i na kategorijskoj strani i na strani brenda; kad se sledeći
 * put dira, seli se u `src/lib` (ovde je prepisan da strane ostanu nezavisne).
 */
function artikala(n: number): string {
  const jedinice = n % 10;
  const desetice = n % 100;
  if (jedinice === 1 && desetice !== 11) return "artikal";
  if (jedinice >= 2 && jedinice <= 4 && (desetice < 12 || desetice > 14)) return "artikla";
  return "artikala";
}

const broj = (n: number) => n.toLocaleString("sr-RS");

/**
 * Čitljiva imena aktivnih filtera („Maske i futrole", „Apple") — za naslov i
 * opis strane. Ključevi iz URL-a se ne prikazuju kupcu.
 */
function nazviFiltere(upit: Upit): string[] {
  const nazivi: string[] = [];
  if (upit.izbor.tip?.length) {
    const tipovi = new Map(productTypes().map((t) => [t.key, t.label]));
    for (const k of upit.izbor.tip) nazivi.push(tipovi.get(k) ?? k);
  }
  if (upit.izbor.brend?.length) {
    const brendovi = new Map(productBrands().map((b) => [b.key, b.label]));
    for (const k of upit.izbor.brend) nazivi.push(brendovi.get(k) ?? k);
  }
  for (const k of upit.izbor.cena ?? []) nazivi.push(CENOVNI_LABELE[k] ?? k);
  return nazivi;
}

export function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Metadata {
  const upit = parseUpit(searchParams);
  const opisFiltera = nazviFiltere(upit);
  if (upit.q) opisFiltera.push(`pretraga „${upit.q}”`);

  const suzeno = opisFiltera.length > 0;
  const naStrani = upit.strana > 1 ? `, strana ${upit.strana}` : "";

  return {
    title: suzeno
      ? `${opisFiltera.join(" · ")} — prodavnica${naStrani}`
      : `Prodavnica — oprema za mobilne telefone${naStrani}`,
    description: suzeno
      ? `Cene za: ${opisFiltera.join(", ")}. Svaki artikal ima cenu u dinarima; naručivanje ide preko Vibera, WhatsApp-a ili Instagrama.`
      : `Maske, zaštitna stakla, punjači, kablovi, baterije i ekrani — ${broj(getAllProducts().length)} artikala sa cenom u dinarima. Javite se na Viber, WhatsApp ili Instagram i rezervišite.`,
    /**
     * Kombinacija tri fasete daje hiljade URL-ova sa istim artiklima u drugom
     * redosledu. Filtrirane strane su korisne kupcu (link se deli, radi na
     * osvežavanje), ali ne i indeksu — zato `noindex, follow`: pauk ide dalje
     * kroz linkove ka proizvodima, a u indeks ulazi samo čista prodavnica.
     */
    robots: { index: !suzeno && upit.strana === 1, follow: true },
    alternates: { canonical: "/prodavnica" },
  };
}

export default function ProdavnicaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const upit = parseUpit(searchParams);
  // `pretrazi` sam odseca stranu na postojeći opseg — „?strana=999" prikaže
  // poslednju stranu umesto 404, jer nastaje i pri sužavanju filtera.
  const { strana, ukupno, brojStrana, tekucaStrana, fasete, aktivnih } = pretrazi(upit);

  const prvi = (tekucaStrana - 1) * PO_STRANI + 1;
  const poslednji = prvi + strana.length - 1;
  const uKatalogu = getAllProducts().length;

  return (
    <>
      <PageHeader
        eyebrow="Prodavnica"
        title="Oprema za mobilne telefone"
        description={`Maske, stakla, punjači, kablovi, baterije i ekrani — ${broj(uKatalogu)} artikala sa cenom. Nema korpe: izaberete artikal, javite se na Viber, WhatsApp ili Instagram i mi ga spremimo.`}
      />

      <section className="section pt-10 md:pt-12">
        <div className="container">
          <FilterKontrole
            fasete={fasete}
            izbor={upit.izbor}
            q={upit.q}
            sort={upit.sort}
            ukupno={ukupno}
          />

          {ukupno > 0 ? (
            <>
              {/* Naslov regiona rezultata: vidljivo ga nosi brojač ispod, ali
                  bez njega outline strane skače sa h1 pravo na h3 iz kartica. */}
              <h2 className="sr-only">Rezultati</h2>
              <p className="mt-6 text-sm text-muted-foreground">
                Prikazano{" "}
                <span className="font-semibold text-cream">
                  {broj(prvi)}–{broj(poslednji)}
                </span>{" "}
                od <span className="font-semibold text-cream">{broj(ukupno)}</span>{" "}
                {artikala(ukupno)}
                {brojStrana > 1 ? (
                  <>
                    {" "}
                    · strana {tekucaStrana} od {brojStrana}
                  </>
                ) : null}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
                {strana.map((item) => (
                  <ProizvodKartica key={item.id} item={item} />
                ))}
              </div>

              <Paginacija upit={upit} tekuca={tekucaStrana} strana={brojStrana} />
            </>
          ) : (
            <PraznoStanje />
          )}

          {/*
            Mreža nosi najviše 24 linka, a katalog ima preko 14.000 artikala.
            Kategorijske strane su ulaz u ostatak — bez njih bi većina proizvoda
            visila samo u sitemap-u, što Google ostavlja u „Discovered –
            currently not indexed". Prikazuju se samo na neizfiltriranoj prvoj
            strani, da ne dupliraju sadržaj filtriranih prikaza.
          */}
          {aktivnih === 0 && tekucaStrana === 1 ? (
            <nav
              aria-label="Kategorije prodavnice"
              className="mt-14 border-t border-ink-600 pt-8"
            >
              <h2 className="text-[0.78rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Pregled po kategorijama
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {productTypes().map((t) => (
                  <li key={t.key}>
                    <Link
                      href={kategorijaHref(t.key)}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-3.5 py-1.5 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
                    >
                      {t.label}
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {broj(t.count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                Ili prelistajte{" "}
                <Link
                  href="/katalog/1"
                  className="font-medium text-brand-400 hover:underline"
                >
                  kompletan katalog
                </Link>
                .
              </p>
            </nav>
          ) : null}
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Paginacija                                 */
/* -------------------------------------------------------------------------- */

const STRANICA =
  "inline-flex h-10 min-w-[2.5rem] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors";
const STRANICA_MIRNA =
  "border-ink-600 bg-ink-800 text-cream/80 hover:border-brand-500 hover:text-brand-400";
const STRANICA_AKTIVNA = "border-brand bg-brand text-cream shadow-glow";
const STRANICA_UGASENA = "border-ink-600/50 text-muted-foreground/50";

/**
 * Prva, poslednja i tekuća ±1, ostalo elipsa. Sa 600 strana bi puna lista bila
 * duža od same mreže proizvoda.
 */
function straniceZaPrikaz(tekuca: number, ukupno: number): (number | "…")[] {
  const okvir = [1, tekuca - 1, tekuca, tekuca + 1, ukupno]
    .filter((n, i, sve) => n >= 1 && n <= ukupno && sve.indexOf(n) === i)
    .sort((a, b) => a - b);

  const redom: (number | "…")[] = [];
  for (const n of okvir) {
    const prethodni = redom[redom.length - 1];
    // Rupa veća od jedne strane se zamenjuje elipsom; rupa od tačno jedne
    // strane ne — bolje da se broj vidi nego da tri tačke kriju jednu stranu.
    if (typeof prethodni === "number" && n - prethodni > 1) redom.push("…");
    redom.push(n);
  }
  return redom;
}

/**
 * Paginacija je serverska i od običnih `<Link>`-ova: „prikaži još" na dugmetu
 * ne može da se deli linkom, a pauk ga nikad ne klikne.
 */
function Paginacija({
  upit,
  tekuca,
  strana: brojStrana,
}: {
  upit: Upit;
  tekuca: number;
  strana: number;
}) {
  if (brojStrana <= 1) return null;

  const href = (n: number) => {
    const qs = upitUQuery({ ...upit, strana: n });
    return qs ? `/prodavnica?${qs}` : "/prodavnica";
  };

  return (
    <nav
      aria-label="Strane prodavnice"
      className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-ink-600 pt-8"
    >
      {tekuca > 1 ? (
        <Link href={href(tekuca - 1)} rel="prev" className={`${STRANICA} ${STRANICA_MIRNA}`}>
          <ChevronLeft aria-hidden className="h-4 w-4" />
          <span className="hidden sm:inline">Prethodna</span>
          <span className="sr-only sm:hidden">Prethodna strana</span>
        </Link>
      ) : (
        // Ugašeno dugme ostaje na mestu: bez njega brojevi „skaču" ulevo kad se
        // pređe sa prve strane na drugu.
        <span aria-hidden className={`${STRANICA} ${STRANICA_UGASENA}`}>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prethodna</span>
        </span>
      )}

      {straniceZaPrikaz(tekuca, brojStrana).map((n, i) =>
        n === "…" ? (
          <span
            key={`elipsa-${i}`}
            aria-hidden
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : n === tekuca ? (
          <span
            key={n}
            aria-current="page"
            aria-label={`Strana ${n}, tekuća`}
            className={`${STRANICA} ${STRANICA_AKTIVNA} tabular-nums`}
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={href(n)}
            aria-label={`Strana ${n}`}
            className={`${STRANICA} ${STRANICA_MIRNA} tabular-nums`}
          >
            {n}
          </Link>
        ),
      )}

      {tekuca < brojStrana ? (
        <Link href={href(tekuca + 1)} rel="next" className={`${STRANICA} ${STRANICA_MIRNA}`}>
          <span className="hidden sm:inline">Sledeća</span>
          <span className="sr-only sm:hidden">Sledeća strana</span>
          <ChevronRight aria-hidden className="h-4 w-4" />
        </Link>
      ) : (
        <span aria-hidden className={`${STRANICA} ${STRANICA_UGASENA}`}>
          <span className="hidden sm:inline">Sledeća</span>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Prazan rezultat                              */
/* -------------------------------------------------------------------------- */

/**
 * Prazan rezultat nije kraj razgovora: na sajtu je samo ono što je u
 * dobavljačkim katalozima, a u radnji stoji i više. Zato umesto „nema
 * rezultata" idu kontakt kanali.
 */
function PraznoStanje() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-800/60 px-6 py-14 text-center">
      <h2 className="font-display text-xl font-bold text-cream md:text-2xl">
        Za ove filtere nemamo artikal u katalogu
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Ovde je samo ono što je trenutno u katalozima — asortiman u radnji je
        širi, a nove stvari stižu svake nedelje. Napišite nam koji telefon imate
        i šta vam treba, proverimo i kažemo cenu.
      </p>
      <KontaktDugmad className="mt-6 justify-center" />
    </div>
  );
}
