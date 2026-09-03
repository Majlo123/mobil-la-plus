import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Cena } from "@/components/Cena";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { kategorijaHref, productPath } from "@/lib/catalog";
import {
  getAllProducts,
  katalogBrojStrana,
  katalogStrana,
  productTypes,
  KATALOG_PO_STRANI,
} from "@/lib/products";

/**
 * Kataloški indeks — sve što sajt ima, 120 po strani, kao obični linkovi.
 *
 * Ovo je jedina ruta koja garantuje da svaki artikal iz kataloga (trenutno ih
 * je preko 35.000, u 300 strana) ima interni link. `/prodavnica` filtrira preko
 * `searchParams` pa nosi `noindex` na kombinacijama, a kategorijske strane i
 * strane brendova pokrivaju ono što ljudi pretražuju — ne i ceo rep kataloga.
 *
 * Zato je ovo „čvorna" strana za obilazak i drži se laganom: bez slika, bez
 * kartica i bez kontakt dugmadi po redu. Sa četiri kanala po artiklu bi svaka
 * strana nosila 480 dodatnih linkova sa dugačkim `viber://` i `wa.me` adresama
 * — pauk bi lutao, a mobilni korisnik čekao. Cena stoji uz naziv, a kontakt
 * jednom, na vrhu strane; puna kartica sa dugmadima je na artiklu.
 */

/* Strane su statične (1…N) — „/katalog/999" i „/katalog/abc" idu na 404. */
export const dynamicParams = false;

const parseStrana = (raw: string) => (/^\d+$/.test(raw) ? Number(raw) : NaN);

const broj = (n: number) => n.toLocaleString("sr-RS");

export function generateStaticParams() {
  return Array.from({ length: katalogBrojStrana() }, (_, i) => ({
    strana: String(i + 1),
  }));
}

export function generateMetadata({
  params,
}: {
  params: { strana: string };
}): Metadata {
  const strana = parseStrana(params.strana);
  const ukupnoStrana = katalogBrojStrana();
  if (!Number.isFinite(strana) || strana < 1 || strana > ukupnoStrana) return {};

  const ukupno = getAllProducts().length;

  return {
    title: `Katalog — strana ${strana} od ${ukupnoStrana}`,
    description: `Spisak svih ${broj(ukupno)} artikala iz ponude — maske, zaštitna stakla, punjači, kablovi, baterije i ekrani, sa cenama u dinarima. Strana ${strana} od ${ukupnoStrana}.`,
    alternates: { canonical: `/katalog/${strana}` },
    /**
     * `index: true` namerno i eksplicitno: strane su tanke, ali svaka je
     * jedinstven spisak sa cenama i jedini put kojim pauk stiže do repa
     * kataloga. Nizak prioritet u `sitemap.ts` govori Google-u da su za
     * obilazak, ne za ljude — to je posao prioriteta, ne `noindex`-a.
     */
    robots: { index: true, follow: true },
  };
}

export default function KatalogPage({ params }: { params: { strana: string } }) {
  const strana = parseStrana(params.strana);
  const ukupnoStrana = katalogBrojStrana();
  if (!Number.isFinite(strana) || strana < 1 || strana > ukupnoStrana) notFound();

  const items = katalogStrana(strana);
  const ukupno = getAllProducts().length;
  const prvi = (strana - 1) * KATALOG_PO_STRANI + 1;
  const poslednji = prvi + items.length - 1;

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: "Katalog", href: "/katalog/1" },
          ...(strana > 1
            ? [{ naziv: `Strana ${strana}`, href: `/katalog/${strana}` }]
            : []),
        ]}
      />

      <PageHeader
        eyebrow={`Strana ${strana} od ${ukupnoStrana}`}
        title="Kompletan katalog"
        description={`Artikli ${broj(prvi)}–${broj(poslednji)} od ukupno ${broj(ukupno)}. Kliknite na naziv za cenu, fotografiju i način naručivanja.`}
      />

      <section className="section">
        <div className="container">
          {/* Kontakt jednom, na vrhu: u spisku od 120 redova dugmad po redu ne
              bi pomogla nikome (vidi napomenu na vrhu fajla). */}
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card md:flex-row md:items-center md:justify-between md:gap-6">
            <div>
              <p className="font-semibold text-cream">Cene su maloprodajne, u dinarima</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Nema korpe — javite se za dostupnost i rezervaciju, odgovaramo isti dan.
              </p>
            </div>
            <KontaktDugmad className="shrink-0" />
          </div>

          {/*
            Dve kolone na širokim ekranima: 120 redova u jednoj koloni je pola
            metra skrola, a red je ionako uzak (naziv + cena).
          */}
          <ul className="mt-10 grid gap-x-10 sm:grid-cols-2">
            {items.map((p) => (
              <li key={p.id} className="border-b border-ink-600/70">
                <Link
                  href={productPath(p)}
                  className="group flex items-center justify-between gap-4 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* `min-w-0` uz `flex-1`: bez toga flex stavka ne sme da se
                      skupi ispod svog sadržaja, pa `truncate` nema efekta i
                      dugi nazivi guraju cenu van reda. */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-cream/85 transition-colors group-hover:text-brand-400">
                      {p.name}
                    </span>
                    <span className="block truncate text-[0.7rem] text-muted-foreground">
                      {p.typeLabel}
                      {p.modelLabel ? ` · ${p.modelLabel}` : ""}
                    </span>
                  </span>
                  <Cena rsd={p.price} size="sm" className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>

          <Paginacija tekuca={strana} ukupno={ukupnoStrana} />

          {/* Povratak u „prave" strane: bez ovoga je kataloški indeks slepa
              ulica i za kupca i za pauka. */}
          <nav
            aria-label="Kategorije prodavnice"
            className="mt-12 border-t border-ink-600 pt-8"
          >
            <h2 className="text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
          </nav>
        </div>
      </section>
    </>
  );
}

/* ------------------------------- Paginacija ------------------------------- */

const STRANICA =
  "inline-flex h-10 min-w-[2.5rem] items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors";
const STRANICA_MIRNA =
  "border-ink-600 bg-ink-800 text-cream/80 hover:border-brand-500 hover:text-brand-400";
const STRANICA_AKTIVNA = "border-brand bg-brand text-cream shadow-glow";
const STRANICA_UGASENA = "border-ink-600/50 text-muted-foreground/50";

/**
 * Prva, poslednja i tekuća ±2, ostalo elipsa.
 *
 * Nije kozmetika: sa samo „prethodna/sledeća" bi do poslednje strane vodilo
 * 299 uzastopnih koraka, pa bi rep kataloga bio predubok za obilazak. Ovako je
 * svaka strana na nekoliko skokova od prve.
 */
function straniceZaPrikaz(tekuca: number, ukupno: number): (number | "…")[] {
  const okvir = [1, tekuca - 2, tekuca - 1, tekuca, tekuca + 1, tekuca + 2, ukupno]
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

function Paginacija({ tekuca, ukupno }: { tekuca: number; ukupno: number }) {
  if (ukupno <= 1) return null;

  return (
    <nav
      aria-label="Strane kataloga"
      className="mt-10 flex flex-wrap items-center justify-center gap-2 border-t border-ink-600 pt-8"
    >
      {tekuca > 1 ? (
        <Link
          href={`/katalog/${tekuca - 1}`}
          rel="prev"
          className={`${STRANICA} ${STRANICA_MIRNA}`}
        >
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

      {straniceZaPrikaz(tekuca, ukupno).map((n, i) =>
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
            href={`/katalog/${n}`}
            aria-label={`Strana ${n}`}
            className={`${STRANICA} ${STRANICA_MIRNA} tabular-nums`}
          >
            {n}
          </Link>
        ),
      )}

      {tekuca < ukupno ? (
        <Link
          href={`/katalog/${tekuca + 1}`}
          rel="next"
          className={`${STRANICA} ${STRANICA_MIRNA}`}
        >
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
