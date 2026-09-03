import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { upitUQuery, type Upit } from "@/lib/shop-query";

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
 *
 * Deli je `/prodavnica` i kategorijske strane — otuda `basePath`, umesto da
 * linkovi budu zakucani na `/prodavnica`.
 */
export function Paginacija({
  upit,
  tekuca,
  strana: brojStrana,
  basePath,
}: {
  upit: Upit;
  tekuca: number;
  strana: number;
  basePath: string;
}) {
  if (brojStrana <= 1) return null;

  const href = (n: number) => {
    const qs = upitUQuery({ ...upit, strana: n });
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      aria-label="Strane rezultata"
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
