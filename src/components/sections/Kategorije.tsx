import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { kategorijaHref } from "@/lib/catalog";
import { categories, featuredCategories, type Category } from "@/lib/data";
import { productTypes } from "@/lib/products";

/**
 * Mreža kategorija na početnoj.
 *
 * Server komponenta — broj artikala dolazi iz `productTypes()`, koje uvlači ceo
 * katalog (~1,5 MB) i sme samo na serveru. Broj se ne piše rukom: kad se katalog
 * osveži (`npm run katalog`), početna sama pokaže novo stanje.
 *
 * Kartice vode na `/kategorija/[tip]` — kanonske, statične strane. `/prodavnica`
 * je filtrirana preko `searchParams` i ne sme u indeks, pa su ovi linkovi i
 * jedini put kojim Googlebot sa početne uopšte ulazi u asortiman.
 */

const broj = (n: number) => n.toLocaleString("sr-RS");

export function Kategorije() {
  // `as const` je zbog TS-a: bez njega `map` vrati `(string | number)[]`, pa
  // `Map` ne može da izvede tip ključa i vrednosti.
  const brojPoVrsti = new Map(productTypes().map((t) => [t.key, t.count] as const));

  /**
   * Kategorija bez artikala se izostavlja: `/kategorija/[tip]` generiše strane
   * iz `productTypes()` i ima `dynamicParams = false`, pa bi takva kartica
   * vodila pravo u 404.
   */
  const saArtiklima = (lista: Category[]) =>
    lista
      .map((c) => ({ ...c, count: brojPoVrsti.get(c.key) ?? 0 }))
      .filter((c) => c.count > 0);

  const istaknute = saArtiklima(featuredCategories);
  // Ostatak asortimana (satovi, memorije, delovi, ostalo) ide kao trake ispod
  // mreže — kartica bi im dala težinu koju u prodaji nemaju, a link zaslužuju.
  const ostale = saArtiklima(
    categories.filter((c) => !featuredCategories.some((f) => f.key === c.key)),
  );

  return (
    <section className="section border-t border-ink-600 bg-ink-800/40">
      <div className="container">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Asortiman"
            title="Oprema za telefone, sa cenom uz svaki artikal"
            description="Maske, stakla, punjači i kablovi za skoro sve modele — plus baterije i ekrani koje ugrađujemo na mestu. Cena piše na sajtu, a artikal se rezerviše porukom."
          />
          <Button asChild variant="outline" className="hidden shrink-0 md:inline-flex">
            <Link href="/prodavnica">
              Cela prodavnica
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {istaknute.map((c, i) => {
            const Ikonica = c.icon;

            return (
              <Reveal key={c.key} delay={(i % 3) * 0.07}>
                <Link
                  href={kategorijaHref(c.key)}
                  className="group flex h-full flex-col rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25 transition-colors duration-300 group-hover:bg-brand group-hover:text-cream">
                    <Ikonica aria-hidden className="h-6 w-6" strokeWidth={1.75} />
                  </span>

                  <h3 className="mt-5 flex items-start justify-between gap-3 text-lg font-bold leading-snug text-cream">
                    <span className="transition-colors duration-300 group-hover:text-brand-400">
                      {c.label}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-400"
                    />
                  </h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-cream/70">
                    {c.description}
                  </p>

                  {/* Broj artikala uvek na dnu kartice — u mreži su poravnati. */}
                  <div className="flex-1" />
                  <p className="mt-5 border-t border-ink-600 pt-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <span className="tabular-nums text-brand-400">{broj(c.count)}</span>{" "}
                    u ponudi
                  </p>
                </Link>
              </Reveal>
            );
          })}
        </div>

        {ostale.length > 0 ? (
          <Reveal delay={0.1} className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted-foreground">Još u ponudi:</span>
              {ostale.map((c) => (
                <Link
                  key={c.key}
                  href={kategorijaHref(c.key)}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
                >
                  {c.label}
                  <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                    {broj(c.count)}
                  </span>
                </Link>
              ))}
            </div>
          </Reveal>
        ) : null}

        {/* Na mobilnom dugme iz zaglavlja ne postoji — ovde je puna širina. */}
        <Reveal delay={0.1} className="mt-8 md:hidden">
          <Button asChild variant="outline" className="w-full">
            <Link href="/prodavnica">
              Cela prodavnica
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
