import Link from "next/link";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { Logo } from "@/components/Logo";
import { kategorijaHref } from "@/lib/catalog";
import { categories } from "@/lib/data";
import { nav, site } from "@/lib/site";

/**
 * Futer — poslednja stanica za kupca koji je doskrolovao do dna: NAP podaci,
 * ulaz u svaku kategoriju i kanali za poruku.
 *
 * SERVER komponenta, bez JS-a: sve su linkovi i tekst. Kategorije se čitaju iz
 * `categories`, stranice iz `nav`, kontakt iz `site` — futer ne zna ni jedan
 * broj ni naziv sam od sebe, pa ne može da se raziđe sa ostatkom sajta.
 *
 * Podloga je ink-800 (jedna nijansa iznad crne strane) — na dark-first sajtu
 * granicu sekcije lakše vidi svetlija površina nego ivica na istoj boji.
 */

/* -------------------------------- Stilovi ---------------------------------- */

const NASLOV =
  "font-display text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-cream";

/** Hover ide u brand-400: na crnom je svetlija plava jedini čitljiv „upaljen" link. */
const LINK = "text-cream/60 transition-colors hover:text-brand-400";

const IKONICA = "h-4 w-4 shrink-0 text-brand-400";

export function Footer() {
  return (
    <footer className="relative border-t border-ink-600 bg-ink-800 text-cream/80">
      {/* Mreža sa logotipa, jedva vidljiva i gašena maskom ka dnu — daje dubinu
          bez ijednog dodatnog zahteva ka mreži. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-faint opacity-70 [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent_65%)]"
      />

      <div className="container relative grid gap-10 py-14 sm:grid-cols-2 md:py-16 lg:grid-cols-12 lg:gap-8">
        {/* ------------------------------ Brend ------------------------------ */}
        <div className="lg:col-span-3">
          <Logo variant="full" />

          {/* Opis se ne prepisuje: `site.description` je isti tekst koji ide u
              meta opis, pa se poruka firme menja na jednom mestu. */}
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/60">
            {site.description}
          </p>

          {/*
            Kanali stoje i u futeru jer su JEDINI način naručivanja — nema korpe
            ni checkout-a. Layout „kompakt" (samo ikonice) je namerno: pun tekst
            bi u ovoj koloni prelomio četiri dugmeta u četiri reda.
          */}
          <p className="mt-7 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Naručivanje ide porukom
          </p>
          <KontaktDugmad layout="kompakt" className="mt-3" />
        </div>

        {/* --------------------------- Kategorije ---------------------------- */}
        {/* `sm:col-span-2`: trinaest naziva u pola širine tableta se izlomi u
            harmoniku, pa kolona na tabletu uzima ceo red i deli se na dva. */}
        <div className="sm:col-span-2 lg:col-span-4">
          <h3 className={NASLOV}>Asortiman</h3>
          <ul className="mt-5 grid gap-x-6 gap-y-3 text-[0.9rem] sm:grid-cols-2">
            {categories.map((c) => (
              <li key={c.key}>
                <Link href={kategorijaHref(c.key)} className={LINK}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------------------------- Stranice ----------------------------- */}
        <div className="lg:col-span-2">
          <h3 className={NASLOV}>Stranice</h3>
          <ul className="mt-5 space-y-3 text-[0.9rem]">
            <li>
              <Link href="/" className={LINK}>
                Početna
              </Link>
            </li>
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
            {/*
              Katalog je straničena lista celog asortimana — kupac ga retko
              koristi (ima pretragu i filtere), ali pretraživačima je to jedini
              put do svakog artikla, pa mu treba link sa svake strane.
            */}
            <li>
              <Link href="/katalog/1" className={LINK}>
                Ceo katalog
              </Link>
            </li>
          </ul>
        </div>

        {/* ----------------------------- Kontakt ----------------------------- */}
        <div className="lg:col-span-3">
          <h3 className={NASLOV}>Kontakt</h3>
          <ul className="mt-5 space-y-4 text-[0.9rem]">
            <li className="flex items-start gap-3">
              <MapPin aria-hidden className={`mt-0.5 ${IKONICA}`} />
              {/* Adresa je tekst, ne link: mapa i uputstvo do radnje stoje na
                  strani Kontakt, gde ima mesta da se objasne. */}
              <span className="text-cream/70">{site.address.full}</span>
            </li>

            <li className="flex items-center gap-3">
              <Phone aria-hidden className={IKONICA} />
              <a href={site.telHref} className={LINK}>
                {site.phoneDisplay}
              </a>
            </li>

            {/* Drugi broj: u zaglavlju bi se takmičio sa glavnim CTA-om, ovde je
                korisna informacija — ako prvi ne odgovara, kupac zna gde još. */}
            <li className="flex items-center gap-3">
              <Phone aria-hidden className={IKONICA} />
              <a href={site.telAltHref} className={LINK}>
                {site.phoneAltDisplay}
              </a>
            </li>

            <li className="flex items-center gap-3">
              <Mail aria-hidden className={IKONICA} />
              <a href={site.mailHref} className={`${LINK} break-all`}>
                {site.email}
              </a>
            </li>

            {/* Jedina potvrđena mreža firme. Facebook/TikTok se NE dodaju dok ne
                dobijemo prave profile — mrtav link u futeru košta više od praznine. */}
            <li className="flex items-center gap-3">
              <Instagram aria-hidden className={IKONICA} />
              <a
                href={site.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
              >
                @{site.socials.instagramHandle}
              </a>
            </li>

            <li className="flex items-start gap-3">
              <Clock aria-hidden className={`mt-0.5 ${IKONICA}`} />
              {/* Dan i sati kao dt/dd: u uskoj koloni „Ponedeljak – Petak 09:00 – 19:00"
                  se slije u jednu rečenicu sa četiri crtice. */}
              <dl className="space-y-1.5">
                {site.hours.map((h) => (
                  <div key={h.day} className="flex flex-wrap items-baseline gap-x-2">
                    <dt className="text-cream/70">{h.day}</dt>
                    <dd className="text-muted-foreground">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </li>
          </ul>
        </div>
      </div>

      {/* ---------------------------- Dno futera ----------------------------- */}
      <div className="relative border-t border-ink-600">
        {/*
          `pb-24` na telefonu: <FloatingContact> je fiksiran u donjem desnom uglu
          i baš na dnu strane bi legao preko ovog reda. Na sm+ red je nizak, pa
          je dovoljno da se desni tekst odmakne od ugla (`sm:pr-16`).
        */}
        <div className="container flex flex-col items-center justify-between gap-2 pb-24 pt-6 text-xs text-muted-foreground sm:flex-row sm:pb-6">
          <p>
            © {new Date().getFullYear()} {site.name}. Sva prava zadržana.
          </p>
          <p className="sm:pr-16">{site.slogan}</p>
        </div>
      </div>
    </footer>
  );
}
