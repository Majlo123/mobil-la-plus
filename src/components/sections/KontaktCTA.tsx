import Link from "next/link";
import { Clock, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * Završna sekcija početne — svi podaci za dolazak i javljanje, na jednom mestu.
 *
 * Ponavlja NAP (ime, adresa, telefon) iz futera namerno: ovo je zadnji ekran pre
 * kraja strane i najčešće mesto sa kog kupac krene da zove. Svi podaci dolaze iz
 * `site` — u ovom fajlu nema ni jednog hardkodovanog broja.
 */

/** Dan bez sati („Zatvoreno") se prikazuje tiše — nije radno vreme, nego info. */
const jeZatvoreno = (vreme: string) => !vreme.includes(":");

export function KontaktCTA() {
  return (
    <section className="section border-t border-ink-600 bg-ink-800/40">
      <div className="container">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card md:p-10">
            {/* Plavi odsjaj sa logotipa — panel se odvaja od podloge bez slike. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-circuit-glow"
            />

            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
              {/* Poziv na akciju */}
              <div>
                <span className="eyebrow text-brand-400">
                  <span className="h-px w-6 bg-current" />
                  Kontakt
                </span>
                <h2 className="mt-4 max-w-xl text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-balance text-cream sm:text-4xl">
                  Napišite model telefona — javimo cenu i rok isti dan
                </h2>
                <p className="mt-4 max-w-xl text-cream/70">
                  Za artikal iz prodavnice dovoljna je poruka sa naziva kartice; za
                  servis opišite šta se dešava, a slika ili snimak kvara pomažu više
                  od bilo kog opisa. Telefon primamo i kurirskom službom iz cele
                  Srbije.
                </p>

                <KontaktDugmad layout="red" className="mt-7" />

                <p className="mt-5 text-xs text-muted-foreground">
                  Naručivanje ide isključivo porukom ili telefonom — na sajtu nema
                  korpe, pa nema ni pogrešno poslate narudžbine.
                </p>
              </div>

              {/* Podaci radnje */}
              <div className="rounded-2xl border border-ink-600 bg-ink/60 p-6">
                <dl className="space-y-5 text-[0.95rem]">
                  <div className="flex items-start gap-3">
                    <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                    <div>
                      <dt className="font-semibold text-cream">Radnja i servis</dt>
                      <dd className="mt-0.5 text-cream/70">{site.address.full}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-ink-600 pt-5">
                    <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                    <div className="min-w-0 flex-1">
                      <dt className="font-semibold text-cream">Radno vreme</dt>
                      <dd className="mt-1.5 space-y-1">
                        {site.hours.map((h) => (
                          <span key={h.day} className="flex justify-between gap-4">
                            <span className="text-cream/70">{h.day}</span>
                            <span
                              className={
                                jeZatvoreno(h.time)
                                  ? "text-muted-foreground"
                                  : "font-medium tabular-nums text-cream"
                              }
                            >
                              {h.time}
                            </span>
                          </span>
                        ))}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-ink-600 pt-5">
                    <Phone aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                    <div>
                      <dt className="font-semibold text-cream">Telefoni</dt>
                      {/* Oba broja su iz `site` — drugi je rezervni, bez Viber/WhatsApp-a. */}
                      <dd className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a
                          href={site.telHref}
                          className="font-medium tabular-nums text-cream transition-colors hover:text-brand-400"
                        >
                          {site.phoneDisplay}
                        </a>
                        <a
                          href={site.telAltHref}
                          className="tabular-nums text-cream/70 transition-colors hover:text-brand-400"
                        >
                          {site.phoneAltDisplay}
                        </a>
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-ink-600 pt-5">
                    <Mail aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                    <div className="min-w-0">
                      <dt className="font-semibold text-cream">Mejl</dt>
                      <dd className="mt-0.5">
                        <a
                          href={site.mailHref}
                          className="block truncate text-cream/70 transition-colors hover:text-brand-400"
                        >
                          {site.email}
                        </a>
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 border-t border-ink-600 pt-5">
                    <Instagram aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                    <div className="min-w-0">
                      <dt className="font-semibold text-cream">Instagram</dt>
                      <dd className="mt-0.5">
                        <a
                          href={site.socials.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cream/70 transition-colors hover:text-brand-400"
                        >
                          @{site.socials.instagramHandle}
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>

                <Button asChild variant="outline" size="sm" className="mt-6 w-full">
                  <Link href="/kontakt">Mapa i kako do nas</Link>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
