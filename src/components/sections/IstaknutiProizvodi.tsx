import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ProizvodKartica } from "@/components/ProizvodKartica";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { kategorijaHref } from "@/lib/catalog";
import { categories } from "@/lib/data";
import { imaCenu } from "@/lib/pricing";
import { getProductsByType, type Product } from "@/lib/products";

/**
 * Izlog sa početne — po nekoliko artikala iz najtraženijih kategorija.
 *
 * Nije dekoracija nego jedini ulaz u katalog za pretraživač: `/prodavnica`
 * filtrira preko `searchParams` (ne sme u indeks), pa su ove kartice i zaglavlja
 * blokova prvi interni linkovi ka `/proizvod/[slug]` i `/kategorija/[tip]` koje
 * Googlebot vidi na početnoj.
 *
 * Server komponenta — `getProductsByType` uvlači ceo katalog (~1,5 MB) i sme
 * samo na serveru; u pretraživač odlazi gotov HTML.
 */

/** Kategorije koje se najviše traže; redosled je i redosled blokova na strani. */
const U_IZLOGU = ["maske", "stakla", "baterije", "ekrani"] as const;

/** Po koliko artikala u bloku — 4 popunjava i mobilnu (2×2) i široku (1×4) mrežu. */
const PO_BLOKU = 4;

const broj = (n: number) => n.toLocaleString("sr-RS");

/**
 * Deo dobavljača umesto fotografije vraća svoju generičku pločicu
 * („default_product.png"). Na kategorijskoj strani je to jedna kartica među
 * pedeset, ali u izlogu na početnoj izgleda kao pokvarena slika — zato ispada.
 */
const imaFotografiju = (url: string | undefined): url is string =>
  typeof url === "string" && !url.includes("default_product");

/**
 * Ravnomerno raspoređen uzorak iz abecednog niza.
 *
 * Prva četiri artikla bila bi po pravilu četiri varijante iste maske za isti
 * model; ovako u izlogu stoje različiti telefoni. Redosled ostaje isti u svakom
 * build-u (bez `Math.random`, da se HTML ne menja između build-ova).
 */
function uzorak(items: Product[], koliko: number): Product[] {
  if (items.length <= koliko) return items;
  const korak = Math.floor(items.length / koliko);
  return Array.from({ length: koliko }, (_, i) => items[i * korak]);
}

type Blok = {
  key: string;
  label: string;
  Ikonica?: LucideIcon;
  /** Koliko artikala kategorija ima ukupno — vodi na kategorijsku stranu. */
  ukupno: number;
  artikli: Product[];
};

function blokovi(): Blok[] {
  return U_IZLOGU.map((key) => {
    const kategorija = categories.find((c) => c.key === key);
    const svi = getProductsByType(key);
    // U izlog ide samo artikal koji ima i cenu i pravu fotografiju: kartica bez
    // jednog od to dvoje ne prodaje ništa, a ovde je svaka kartica na prvom ekranu.
    const spremni = svi
      .filter((p) => imaCenu(p.price) && imaFotografiju(p.image))
      .sort((a, b) => a.name.localeCompare(b.name, "sr"));

    return {
      key,
      label: kategorija?.label ?? key,
      ...(kategorija ? { Ikonica: kategorija.icon } : {}),
      // Broj je ceo asortiman kategorije, isti onaj koji piše na
      // `/kategorija/[tip]` — ne broj kartica u izlogu.
      ukupno: svi.length,
      artikli: uzorak(spremni, PO_BLOKU),
    };
  }).filter((b) => b.artikli.length > 0);
}

export function IstaknutiProizvodi() {
  const lista = blokovi();

  return (
    <section className="section border-t border-ink-600">
      <div className="container">
        <SectionHeading
          eyebrow="Iz prodavnice"
          title="Cena stoji na sajtu — javite se i artikal je rezervisan"
          description="Nema korpe ni čekiranja: kliknete Viber, WhatsApp ili Instagram ispod cene i poruka o tom artiklu je već napisana. Potvrdimo dostupnost isti dan."
        />

        <div className="mt-12 space-y-12">
          {lista.map(({ key, label, Ikonica, ukupno, artikli }) => (
            <div key={key}>
              <Reveal className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-600 pb-4">
                {/* Broj je van <h3>: u naslovu bi ga čitač ekrana pročitao kao
                    deo imena kategorije („Maske i futrole 9.247"). */}
                <div className="flex items-center gap-3">
                  {Ikonica ? (
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25">
                      <Ikonica aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                  ) : null}
                  <h3 className="text-xl font-bold text-cream">{label}</h3>
                  <span className="text-sm font-medium text-muted-foreground">
                    <span className="tabular-nums">{broj(ukupno)}</span> u ponudi
                  </span>
                </div>
                <Link
                  href={kategorijaHref(key)}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition-colors hover:text-brand-500"
                >
                  Sve iz kategorije
                  <ArrowUpRight
                    aria-hidden
                    className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </Reveal>

              {/*
                Kartice nisu pojedinačno u `Reveal`: šesnaest framer instanci na
                početnoj košta više nego što efekat donosi. Animiraju se zaglavlja.
              */}
              <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                {artikli.map((item) => (
                  <ProizvodKartica key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-12">
          <div className="flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-cream">Ovo je samo deo ponude</p>
              <p className="mt-1 text-sm text-muted-foreground">
                U prodavnici pretražujete po modelu telefona i filtrirate po ceni — a
                imamo i ono što nije stiglo na sajt.
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/prodavnica">
                Otvori prodavnicu
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
