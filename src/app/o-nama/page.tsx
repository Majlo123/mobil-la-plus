import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Instagram,
  MapPin,
  Phone,
  Store,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { advantages, featuredCategories, usluge } from "@/lib/data";
import { site, SITE_URL } from "@/lib/site";


export const metadata: Metadata = {
  // Ime firme dodaje šablon iz layout-a, pa se ovde ne ponavlja — ostaje mesta
  // za ono što ljudi zapravo kucaju uz „o nama": grad i delatnost.
  title: "O nama — servis telefona u Novom Sadu",
  description: `${site.name} je servis mobilnih telefona i prodavnica opreme u ${site.address.street}, ${site.address.city}. Ko smo, kako radimo i zašto cenu kažemo pre nego što se uzme alat u ruke.`,
  alternates: { canonical: "/o-nama" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/o-nama`,
    title: `O nama — ${site.name}, ${site.city}`,
    description:
      "Servis mobilnih telefona i prodavnica opreme pod istim krovom. Delovi koje ugrađujemo su isti oni koje prodajemo preko pulta.",
    images: [{ url: "/images/brend/logo.jpg", alt: `${site.name} — ${site.slogan}` }],
  },
};

export default function ONamaPage() {
  return (
    <>
      <PutanjaJsonLd stavke={[{ naziv: "O nama", href: "/o-nama" }]} />

      <PageHeader
        eyebrow="O nama"
        title="Servis i oprema za telefone, na jednom mestu"
        description={`${site.name} je servis mobilnih telefona i prodavnica opreme u ulici ${site.address.street} u Novom Sadu.`}
      />

      {/* Ko smo + vizit karta */}
      <section className="section">
        <div className="container grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">
              <span className="h-px w-6 bg-current" />
              Ko smo
            </span>
            <h2 className="mt-4 max-w-xl text-3xl font-bold text-balance text-cream sm:text-4xl">
              Radionica sa pultom, a ne pult sa radionicom
            </h2>
            <div className="mt-5 space-y-4 text-cream/70">
              <p>
                Telefon koji ostavite otvara se ovde, u našoj radionici — ne šaljemo
                uređaje nekom trećem i ne primamo posao koji ne umemo da završimo.
                Radimo alatom i opremom napravljenom za mikrolemljenje, pa se
                otvaranje ne završava novim ogrebotinama i pokidanim flet kablovima.
              </p>
              <p>
                Uz servis držimo prodavnicu: maske, zaštitna stakla, baterije, punjače,
                kablove i sitnu opremu.
              </p>
              <p>
                Cenu i rok kažemo pre nego što se uzme alat u ruke. Ako popravka
                nije isplativa, i to ćemo reći — to je najkraći način da nam se čovek
                vrati i sledeći put.
              </p>
            </div>

            <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800/70 px-4 py-2 text-sm font-semibold text-brand-400">
              <MapPin aria-hidden className="h-4 w-4" />
              {site.address.full}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <VizitKarta />
          </Reveal>
        </div>
      </section>

      {/* Šta radimo — dve strane iste radnje */}
      <section className="section border-t border-ink-600 bg-ink-800/40">
        <div className="container">
          <SectionHeading
            eyebrow="Šta radimo"
            title="Dve stvari, i obe do kraja"
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <article className="flex h-full flex-col rounded-3xl border border-ink-600 bg-ink-800 p-7 shadow-card md:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25">
                  <Wrench aria-hidden className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-xl font-bold text-cream">Servis mobilnih telefona</h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-cream/70">
                  Kvar prvo pogledamo, pa kažemo cenu i rok. Za deo koji ugrađujemo
                  kažemo tačno šta je — originalni ili kvalitetan
                  zamenski — i na njega ide garancija.
                </p>

                {/*
                  Spisak usluga dolazi iz `usluge`, ne prepisan: kad se ponuda
                  promeni na jednom mestu, menja se i ovde i na `/servis`.
                */}
                <ul className="mt-6 flex-1 space-y-2.5 border-t border-ink-600 pt-6 text-[0.95rem] text-cream/80">
                  {usluge.map((u) => (
                    <li key={u.key} className="flex items-start gap-2">
                      <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                      {u.title}
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="mt-7 self-start">
                  <Link href="/servis">
                    Sve o servisu i rokovima
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            </Reveal>

            <Reveal delay={0.08}>
              <article className="flex h-full flex-col rounded-3xl border border-ink-600 bg-ink-800 p-7 shadow-card md:p-8">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/25">
                  <Store aria-hidden className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-xl font-bold text-cream">Prodavnica opreme</h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-cream/70">
                  Cene stoje uz svaki artikal, u dinarima. Nema korpe ni plaćanja
                  na sajtu — pišete na Viber, WhatsApp ili Instagram, potvrdimo da
                  je model na stanju i dogovorimo preuzimanje.
                </p>

                {/*
                  Kategorije su ovde samo oznake, bez linkova: `/kategorija/[tip]`
                  postoji samo za vrste koje imaju artikala u katalogu, pa bi
                  fiksni link ka praznoj kategoriji vodio na 404. Put ka robi je
                  dugme ispod, gde su pretraga i filteri.
                */}
                <ul className="mt-6 flex flex-1 flex-wrap content-start gap-2 border-t border-ink-600 pt-6">
                  {featuredCategories.map((c) => (
                    <li
                      key={c.key}
                      className="rounded-full border border-ink-600 bg-ink-700/60 px-3 py-1.5 text-xs font-semibold text-cream/75"
                    >
                      {c.short}
                    </li>
                  ))}
                </ul>

                <Button asChild variant="outline" className="mt-7 self-start">
                  <Link href="/prodavnica">
                    Pogledaj prodavnicu
                    <ArrowRight aria-hidden className="h-4 w-4" />
                  </Link>
                </Button>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Zašto mi — četiri poruke sa flajera */}
      <section className="section border-t border-ink-600">
        <div className="container">
          <SectionHeading
            align="center"
            eyebrow="Zašto baš mi"
            title="Četiri stvari na koje možete da računate"
            description="Ništa od ovoga nije slogan — to su pravila po kojima radnja radi svaki dan."
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a, i) => {
              const Ikonica = a.icon;
              return (
                <Reveal key={a.title} delay={(i % 4) * 0.06}>
                  <div className="h-full rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card transition-colors duration-300 hover:border-brand/40">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25">
                      <Ikonica aria-hidden className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-5 text-lg font-bold leading-snug text-cream">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-cream/70">{a.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gde smo */}
      <section className="section border-t border-ink-600 bg-ink-800/40">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <Reveal>
            <h2 className="max-w-xl text-3xl font-bold text-balance text-cream sm:text-4xl">
              Gde smo i kada radimo
            </h2>
            {/*
              Adresa se ne uvlači u rečenicu iz `site` — „Novi Sad" bi u padežu
              postao „Novi Sadu". Grad ide kao tekst, tačna adresa stoji ispod.
            */}
            <p className="mt-4 max-w-xl text-cream/70">
              Radnja je u Novom Sadu, a telefone primamo i kurirskom službom iz cele
              Srbije. Ako niste iz grada, javite se pre slanja — dogovorimo se oko
              kvara, cene i načina vraćanja.
            </p>

            <div className="mt-7 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div>
                  <p className="font-semibold text-cream">Adresa</p>
                  <p className="text-sm text-cream/70">{site.address.full}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-cream">Radno vreme</p>
                  <ul className="mt-1.5 max-w-xs space-y-1 text-sm text-cream/70">
                    {site.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-4">
                        <span>{h.day}</span>
                        <span className="font-medium text-cream/90">{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Button asChild variant="outline" className="mt-7">
              <Link href="/kontakt">
                Mapa i svi kontakti
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card md:p-7">
              <h3 className="text-lg font-bold text-cream">Javite se pre dolaska</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">
                Napišite model telefona i šta se dešava — kažemo da li deo imamo i
                koliko popravka košta, pa ne putujete uzalud. Poruka stiže direktno
                nama, bez posrednika.
              </p>
              {/* „kolona" jer u uskoj kartici puna imena kanala ne staju u red. */}
              <KontaktDugmad layout="kolona" className="mt-5" />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Vizit karta                                 */
/* -------------------------------------------------------------------------- */

/**
 * Osnovni podaci radnje uz logotip — zamena za sliku flajera na ovom mestu.
 *
 * Flajer se NE prikazuje na sajtu: poslat je kao izvor podataka i smera
 * dizajna, a ne kao slika za objavu. Sve sa njega već stoji kao tekst (usluge
 * u `lib/data.ts`, kontakt u `lib/site.ts`), pa bi slika bila samo nečitljiva
 * kopija istog sadržaja — bez linkova, bez prelamanja na telefonu i nevidljiva
 * za pretragu.
 */
function VizitKarta() {
  const podaci: { ikona: LucideIcon; naziv: string; sadrzaj: React.ReactNode }[] = [
    { ikona: MapPin, naziv: "Adresa", sadrzaj: site.address.full },
    {
      ikona: Clock,
      naziv: "Radno vreme",
      sadrzaj: (
        <span className="space-y-0.5">
          {site.hours.map((h) => (
            <span key={h.day} className="block">
              {h.day}: <span className="text-cream">{h.time}</span>
            </span>
          ))}
        </span>
      ),
    },
    {
      ikona: Phone,
      naziv: "Telefon",
      sadrzaj: (
        <span className="space-x-2">
          <a href={site.telHref} className="text-cream hover:text-brand-400">
            {site.phoneDisplay}
          </a>
          <span aria-hidden>·</span>
          <a href={site.telAltHref} className="text-cream hover:text-brand-400">
            {site.phoneAltDisplay}
          </a>
        </span>
      ),
    },
    {
      ikona: Instagram,
      naziv: "Instagram",
      sadrzaj: (
        <a
          href={site.socials.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cream hover:text-brand-400"
        >
          @{site.socials.instagramHandle}
        </a>
      ),
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:28px_28px] opacity-60" />

      <div className="relative">
        <div className="flex items-center gap-4">
          <Image
            src="/images/brend/logo.jpg"
            alt={`${site.name} — logotip`}
            width={96}
            height={96}
            className="h-20 w-20 shrink-0 rounded-full border border-ink-600 object-cover"
          />
          <div>
            <p className="font-display text-xl font-bold leading-tight text-cream">
              {site.name}
            </p>
            <p className="text-sm text-brand-400">{site.address.city}</p>
            <p className="mt-1 text-xs text-muted-foreground">{site.slogan}</p>
          </div>
        </div>

        <dl className="mt-6 space-y-4 border-t border-ink-600 pt-6">
          {podaci.map(({ ikona: Ikona, naziv, sadrzaj }) => (
            <div key={naziv} className="flex gap-3">
              <Ikona
                className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                strokeWidth={1.8}
                aria-hidden
              />
              <div className="min-w-0 text-sm">
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                  {naziv}
                </dt>
                <dd className="mt-0.5 text-cream/80">{sadrzaj}</dd>
              </div>
            </div>
          ))}
        </dl>

        <KontaktDugmad layout="kolona" className="mt-6 border-t border-ink-600 pt-6" />
      </div>
    </div>
  );
}
