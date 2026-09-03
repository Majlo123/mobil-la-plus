import type { Metadata } from "next";
import Link from "next/link";
import { Home, Phone, Store, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * 404. Katalog ima hiljade artikala i menja se sa svakim novim cenovnikom, pa
 * su mrtvi linkovi (stari slug, deljen link, artikal koji je izbačen) normalna
 * stvar — zato ova strana nije samo izvinjenje, nego raskrsnica: prodavnica,
 * servis i kontakt, plus broj telefona za slučaj da je čovek tražio artikal.
 */

export const metadata: Metadata = {
  title: "Stranica nije pronađena",
  // 404 već ide sa noindex zaglavljem; ovo je za slučaj da neko link deli dalje.
  robots: { index: false, follow: true },
};

const putevi = [
  {
    href: "/prodavnica",
    Ikonica: Store,
    naslov: "Prodavnica",
    opis: "Maske, stakla, baterije, punjači i kablovi — sa cenama.",
  },
  {
    href: "/servis",
    Ikonica: Wrench,
    naslov: "Servis telefona",
    opis: "Zamena ekrana i baterije, Google nalog, spašavanje podataka.",
  },
  {
    href: "/kontakt",
    Ikonica: Phone,
    naslov: "Kontakt",
    opis: "Adresa, radno vreme, mapa i svi brojevi.",
  },
];

export default function NotFound() {
  return (
    <section className="relative isolate grid min-h-[80vh] place-items-center overflow-hidden px-5 pb-16 pt-28 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-circuit-glow" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-faint [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="container animate-fade-up max-w-3xl text-center">
        <p className="font-display text-7xl font-extrabold leading-none tracking-[-0.03em] text-brand-500 md:text-8xl">
          404
        </p>
        <h1 className="mt-5 text-2xl font-bold text-balance text-cream md:text-4xl">
          Ove stranice nema
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-cream/70">
          Link je pogrešan ili je artikal u međuvremenu izbačen iz kataloga. Ako ste
          tražili nešto konkretno — pišite nam, pa kažemo da li to imamo.
        </p>

        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {putevi.map(({ href, Ikonica, naslov, opis }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25 transition-colors group-hover:bg-brand group-hover:text-cream">
                <Ikonica aria-hidden className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="mt-4 block font-semibold text-cream">{naslov}</span>
              <span className="mt-1 block text-sm leading-relaxed text-cream/60">{opis}</span>
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/">
              <Home aria-hidden className="h-4 w-4" />
              Početna
            </Link>
          </Button>
          {/* Poziv je ovde jedini „primary": čovek koji je pao na 404 najčešće
              traži konkretan artikal, a to se najbrže reši glasom ili porukom. */}
          <Button asChild>
            <a href={site.telHref}>
              <Phone aria-hidden className="h-4 w-4" />
              {site.phoneDisplay}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
