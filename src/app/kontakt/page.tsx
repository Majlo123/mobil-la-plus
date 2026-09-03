import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ExternalLink, Instagram, Mail, MapPin, Phone, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { site, SITE_URL } from "@/lib/site";


export const metadata: Metadata = {
  // Adresa je u naslovu namerno: „kontakt" bez lokacije ne znači ništa ni
  // čoveku u pretrazi ni Google-u. Ime firme dodaje šablon iz layout-a.
  title: `Kontakt — ${site.address.street}, ${site.address.city}`,
  description: `Pozovite ${site.phoneDisplay} ili pišite na Viber, WhatsApp i Instagram. Adresa: ${site.address.full} — radno vreme, mapa i svi kontakti servisa ${site.name}.`,
  alternates: { canonical: "/kontakt" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/kontakt`,
    title: `Kontakt — ${site.name}, ${site.city}`,
    description: `${site.address.full} · ${site.phoneDisplay} · Viber, WhatsApp i Instagram.`,
    images: [{ url: "/images/brend/logo.jpg", alt: `${site.name} — ${site.slogan}` }],
  },
};

/* ---------------------------------- Mapa ---------------------------------- */

/**
 * Google Maps embed BEZ API ključa: `google.com/maps?q=…&output=embed` radi sa
 * običnim upitom, dok zvanični `maps/embed/v1/place` traži ključ i naplaćuje se.
 *
 * Pin se traži po ADRESI, a ne po `site.address.lat/lng` — te koordinate su još
 * približne (u site.ts stoji „ZAMENI"), pa bi promašile ulicu; Google adresu
 * sam razreši tačno. Kad koordinate budu izmerene, ovde se menja samo `q`.
 */
const upitZaMapu = encodeURIComponent(site.address.full);
const mapaEmbed = `https://www.google.com/maps?q=${upitZaMapu}&z=16&hl=sr&output=embed`;
const mapaLink = `https://www.google.com/maps/search/?api=1&query=${upitZaMapu}`;

/* -------------------------------- JSON-LD --------------------------------- */

/**
 * ContactPage + LocalBusiness sa ISTIM `@id` kao firma iz layout-a
 * (`/#mobilplusla`). Isti `@id` znači „ovo je onaj isti entitet, evo još
 * podataka o njemu" — da Google ne vidi dve firme sa istim imenom i adresom.
 *
 * Zato su ovde samo kontakt činjenice koje layout nema: drugi broj telefona i
 * link ka mapi. Radno vreme, geo i opis već stoje u layout-u i ne ponavljaju se.
 */
const kontaktJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${SITE_URL}/kontakt#stranica`,
      url: `${SITE_URL}/kontakt`,
      name: `Kontakt — ${site.name}`,
      inLanguage: "sr-RS",
      about: { "@id": `${SITE_URL}/#mobilplusla` },
    },
    {
      "@type": "LocalBusiness",
      "@id": `${SITE_URL}/#mobilplusla`,
      name: site.name,
      url: SITE_URL,
      telephone: site.phoneIntl,
      email: site.email,
      hasMap: mapaLink,
      address: {
        "@type": "PostalAddress",
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        postalCode: site.address.postalCode,
        addressRegion: site.address.region,
        addressCountry: "RS",
      },
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: site.phoneIntl,
          availableLanguage: "sr",
        },
        {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: site.phoneAltIntl,
          availableLanguage: "sr",
        },
      ],
      sameAs: [site.socials.instagram],
    },
  ],
};

/* -------------------------------- Podaci ---------------------------------- */

type Kanal = {
  Ikonica: LucideIcon;
  label: string;
  value: string;
  href: string;
  /** `viber:`/`tel:`/`mailto:` ne smeju u novi tab — ostaje prazna stranica. */
  eksterno?: boolean;
  napomena: string;
};

/**
 * Klasični kontakt podaci. Viber, WhatsApp i Instagram stoje kao dugmad u
 * <KontaktDugmad> — ovo je lista za one koji broj prepisuju ili zovu sa fiksnog,
 * i ujedno NAP podatak koji Google čita sa strane.
 */
const kanali: Kanal[] = [
  {
    Ikonica: Phone,
    label: "Telefon",
    value: site.phoneDisplay,
    href: site.telHref,
    napomena: "Isti broj je i na Viberu i na WhatsApp-u",
  },
  {
    Ikonica: Phone,
    label: "Dodatni telefon",
    value: site.phoneAltDisplay,
    href: site.telAltHref,
    napomena: "Ako je prvi broj zauzet",
  },
  {
    Ikonica: Mail,
    label: "E-mail",
    value: site.email,
    href: site.mailHref,
    napomena: "Za duže upite — odgovor stiže sporije nego na poruku",
  },
  {
    Ikonica: Instagram,
    label: "Instagram",
    value: `@${site.socials.instagramHandle}`,
    href: site.socials.instagram,
    eksterno: true,
    napomena: "Novi artikli i radovi iz servisa",
  },
];

/* -------------------------------- Stranica -------------------------------- */

export default function KontaktPage() {
  return (
    <>
      <PutanjaJsonLd stavke={[{ naziv: "Kontakt", href: "/kontakt" }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(kontaktJsonLd) }}
      />

      <PageHeader
        eyebrow="Kontakt"
        title="Javite se — dogovor ide direktno"
        description="Nema korpe ni formulara na sajtu. Napišite šta vam treba na Viber, WhatsApp ili Instagram, ili pozovite — poruka stiže pravo nama."
      />

      <section className="section">
        <div className="container grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Akcija: kanali kao dugmad */}
          <Reveal>
            <div className="h-full rounded-3xl border border-ink-600 bg-ink-800 p-7 shadow-card md:p-8">
              <span className="eyebrow">
                <span className="h-px w-6 bg-current" />
                Najbrže
              </span>
              <h2 className="mt-4 text-2xl font-bold text-balance text-cream sm:text-3xl">
                Pišite nam ili pozovite
              </h2>
              <p className="mt-3 text-cream/70">
                U poruci pošaljite model telefona i kratko šta se dešava. Za artikal
                iz prodavnice dovoljan je naziv — odmah kažemo da li je na stanju i
                po kojoj ceni.
              </p>

              {/* „kolona": svaki kanal je puna, palcem lako pogodiva traka. */}
              <KontaktDugmad layout="kolona" className="mt-6" />

              <p className="mt-5 border-t border-ink-600 pt-5 text-sm leading-relaxed text-muted-foreground">
                Slika ili kratak snimak kvara vredi više od bilo kog opisa — ako je
                telefon pao ili se ne pali, pošaljite fotografiju odmah uz prvu poruku.
              </p>
            </div>
          </Reveal>

          {/* Podaci: brojevi, mejl, profil */}
          <Reveal delay={0.1}>
            <div className="space-y-3">
              {kanali.map((k) => (
                <a
                  key={k.label}
                  href={k.href}
                  {...(k.eksterno ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lift"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25 transition-colors group-hover:bg-brand group-hover:text-cream">
                    <k.Ikonica aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {k.label}
                    </span>
                    <span className="block truncate font-semibold text-cream">{k.value}</span>
                    <span className="block truncate text-xs text-cream/60">{k.napomena}</span>
                  </span>
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Adresa i radno vreme */}
      <section className="section border-t border-ink-600 bg-ink-800/40">
        <div className="container grid gap-6 md:grid-cols-2 lg:gap-8">
          <Reveal>
            <div className="h-full rounded-3xl border border-ink-600 bg-ink-800 p-7 shadow-card">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div>
                  <h2 className="font-semibold text-cream">Adresa radnje</h2>
                  <p className="mt-1 text-cream/70">{site.address.full}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    Telefon možete i poslati kurirskom službom na ovu adresu — ali
                    tek pošto se javite i dogovorimo oko kvara i načina vraćanja.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button asChild variant="outline" size="sm">
                      <a href={mapaLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink aria-hidden className="h-4 w-4" />
                        Otvori u Google mapama
                      </a>
                    </Button>
                    {/* Sve o slanju stoji na strani servisa — ovde samo put do njega. */}
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/servis#kurir">
                        <Truck aria-hidden className="h-4 w-4" />
                        Slanje kurirskom službom
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="h-full rounded-3xl border border-ink-600 bg-ink-800 p-7 shadow-card">
              <div className="flex items-start gap-3">
                <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-cream">Radno vreme</h2>
                  <ul className="mt-3 space-y-2 text-[0.95rem] text-cream/70">
                    {site.hours.map((h) => (
                      <li
                        key={h.day}
                        className="flex justify-between gap-4 border-b border-ink-600 pb-2 last:border-0 last:pb-0"
                      >
                        <span>{h.day}</span>
                        <span className="font-semibold text-cream/90">{h.time}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    Van radnog vremena poruke stižu, samo odgovor sačeka do jutra.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Mapa */}
      <section className="section border-t border-ink-600">
        <div className="container">
          <div className="overflow-hidden rounded-3xl border border-ink-600 bg-ink-800 shadow-card">
            <iframe
              title={`Lokacija radnje ${site.name} — ${site.address.full}`}
              src={mapaEmbed}
              /* Mapa je na dnu strane — `lazy` je ne učitava dok se ne doskroluje. */
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[360px] w-full md:h-[440px]"
              style={{ border: 0 }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Ne možete da nađete ulaz? Pozovite {site.phoneDisplay} i uputićemo vas.
          </p>
        </div>
      </section>
    </>
  );
}
