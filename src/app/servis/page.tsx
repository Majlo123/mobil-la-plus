import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Cable,
  Car,
  Check,
  ChevronDown,
  Clock,
  Info,
  Layers,
  MapPin,
  Palette,
  Plug,
  ShieldCheck,
  Smartphone,
  Store,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { kategorijaHref } from "@/lib/catalog";
import { faq, usluge, type Usluga } from "@/lib/data";
import { site, SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";


export const metadata: Metadata = {
  // Naslov je namerno ono što ljudi kucaju u Google, a ne „Naše usluge" —
  // šablon iz layout-a dodaje „| Mobil Plus LA".
  title: "Servis mobilnih telefona Novi Sad",
  description:
    "Zamena ekrana i baterija, popravka konektora, skidanje Google naloga (FRP) i spašavanje podataka. Braće Ribnikar 17, Novi Sad — cenu i rok kažemo pre početka rada.",
  alternates: { canonical: "/servis" },
  keywords: [
    "servis mobilnih telefona Novi Sad",
    "popravka telefona Novi Sad",
    "zamena ekrana Novi Sad",
    "zamena baterije",
    "skidanje Google naloga",
    "FRP unlock",
    "spašavanje podataka sa telefona",
    "telefon pao u vodu",
  ],
  openGraph: {
    type: "website",
    url: `${SITE_URL}/servis`,
    title: "Servis mobilnih telefona — Novi Sad | Mobil Plus LA",
    description:
      "Kompletan servis telefona, skidanje Google naloga i spašavanje podataka. Cenu kažemo pre rada, na ugrađen deo ide garancija.",
    images: [
      {
        url: "/images/brend/logo.jpg",
        alt: `${site.name} — usluge servisa mobilnih telefona`,
      },
    ],
  },
};

/* --------------------------- Tekst po usluzi ------------------------------ */

/**
 * Razvijen opis svake usluge. Kratki opisi u `src/lib/data.ts` su prepisani sa
 * flajera i koriste se na više mesta (početna, futer), pa se ovde NE menjaju —
 * ovo je dodatni tekst koji stoji samo na ovoj strani.
 *
 * `napomena` je namerno deo ugovora: svaka usluga ima granicu preko koje se ne
 * može obećati rezultat (spašavanje podataka najviše od svih). Kupac to treba
 * da pročita PRE nego što donese telefon, a ne posle.
 */
type Detalj = {
  uvod: string[];
  napomena: string;
};

const DETALJI: Record<string, Detalj> = {
  servis: {
    uvod: [
      "Kvar prvo pogledamo, pa kažemo cenu i rok — rad ne počinje dok se ne dogovorimo. Za najčešće modele delovi su na lageru i telefon se obično vraća isti dan; ako deo mora da se poruči, unapred kažemo koliko se čeka.",
      "Za svaki deo kažemo tačno šta ugrađujemo: originalni ili kvalitetan zamenski. Razlika je u ceni i u trajanju, a izbor je Vaš.",
    ],
    napomena:
      "Kod kvarova na matičnoj ploči i kod telefona koji su bili u vodi ne može se unapred obećati da će popravka uspeti. Ako se posle otvaranja pokaže da popravka nije isplativa, reći ćemo Vam to — pre nego što se potroši novac.",
  },
  frp: {
    uvod: [
      "Posle fabričkog reseta telefon traži Google nalog koji je na njemu bio prijavljen. Ako do tog naloga više ne možete da dođete, uređaj je zaključan i ne vredi ništa — tu zaštitu (FRP) skidamo i telefon se vraća u normalnu upotrebu.",
      "Pre dolaska nam pošaljite tačan model i verziju Androida. Postupak se razlikuje od modela do modela, a kod dela novijih uređaja zaštita je takva da posla nema — bolje da to čujete porukom nego posle puta do radnje.",
    ],
    napomena:
      "Nalog skidamo samo sa uređaja za koji možete da pokažete da je Vaš. Tuđe i sumnjive telefone ne primamo, bez izuzetka.",
  },
  podaci: {
    uvod: [
      "Sa telefona koji se ne uključuje, ima razbijen ekran ili je bio u vodi vraćamo slike, kontakte i poruke. Uređaj otvaramo i radimo direktno sa memorijom, alatom i opremom napravljenom za mikrolemljenje.",
      "Prvo pogledamo uređaj i kažemo šta je realno, pa Vi odlučujete da li se ide dalje. Bez obećanja preko telefona i bez cene „na slepo”.",
    ],
    napomena:
      "Ovo NE uspeva uvek i ne obećavamo da će uspeti. Ako je memorijski čip fizički uništen, podataka nema i ne može ih vratiti nijedan servis. Kod novijih telefona podaci su šifrovani, pa bez lock koda ili šifre naloga ni najbolja oprema ne pomaže. Ako je telefon bio u vodi: ne uključujte ga i ne punite — svako uključivanje smanjuje šanse.",
  },
  kurir: {
    uvod: [
      `Ako niste iz Novog Sada, telefon nam pošaljite kurirskom službom na adresu ${site.address.full}. Javite se pre slanja — opišite kvar, pa se dogovorimo oko cene, roka i načina vraćanja.`,
      "Telefon upakujte tako da ne može da se pomera u kutiji i priložite papir sa imenom, brojem telefona i kratkim opisom kvara. Lock kod pošaljite porukom na Viber ili WhatsApp, a ne u paketu.",
    ],
    napomena:
      "Ne šaljite uređaj bez prethodnog dogovora. Paket koji nije najavljen ne možemo da preuzmemo, a telefon u međuvremenu stoji kod kurira.",
  },
};

/* -------------------------------- JSON-LD --------------------------------- */

/**
 * Service + OfferCatalog. `provider` pokazuje na `@id` firme iz layout-a
 * (`/#mobilplusla`) umesto da ponovo opiše radnju — tako Google vidi jedan
 * entitet sa uslugama, a ne dve firme sa istim imenom.
 *
 * Cene nema jer zavisi od modela i dela; schema.org dopušta katalog bez cena.
 */
const servisJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": `${SITE_URL}/servis#usluga`,
  name: `Servis mobilnih telefona — ${site.name}`,
  serviceType: "Servis mobilnih telefona",
  description:
    "Kompletan servis mobilnih telefona u Novom Sadu: zamena ekrana, baterija i konektora, skidanje Google naloga (FRP) i spašavanje podataka sa uništenih telefona.",
  url: `${SITE_URL}/servis`,
  provider: { "@id": `${SITE_URL}/#mobilplusla` },
  // Radnja radi za grad, ali telefone primamo i kurirskom službom iz cele Srbije.
  areaServed: [
    { "@type": "City", name: site.address.city },
    { "@type": "Country", name: site.address.country },
  ],
  availableChannel: {
    "@type": "ServiceChannel",
    servicePhone: site.phoneIntl,
    serviceUrl: `${SITE_URL}/servis`,
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Usluge servisa",
    itemListElement: usluge.map((u) => ({
      "@type": "Offer",
      itemOffered: {
        "@type": "Service",
        name: u.title,
        description: u.description,
        url: `${SITE_URL}/servis#${u.key}`,
      },
    })),
  },
};

/**
 * FAQPage stoji na ovoj strani jer su ovo pitanja o servisu — ista pitanja se
 * ne prijavljuju sa druge strane, da Google ne vidi dva FAQ bloka za isti sadržaj.
 */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

/* -------------------------------- Stranica -------------------------------- */

export default function ServisPage() {
  return (
    <>
      <PutanjaJsonLd stavke={[{ naziv: "Servis telefona", href: "/servis" }]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servisJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHeader
        eyebrow="Servis telefona"
        title="Servis mobilnih telefona u Novom Sadu"
        description="Zamena ekrana i baterije, popravka konektora, skidanje Google naloga i spašavanje podataka. Kvar pogledamo, cenu kažemo pre početka rada — pa Vi odlučujete."
      />

      {/* Kako radimo + oprema uz servis */}
      <section className="section">
        <div className="container grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">
              <span className="h-px w-6 bg-current" />
              Kako radimo
            </span>
            <h2 className="mt-4 max-w-xl text-3xl font-bold text-balance text-cream sm:text-4xl">
              Prvo dijagnostika i cena, pa onda rad
            </h2>
            <div className="mt-5 space-y-4 text-cream/70">
              <p>
                Donesete telefon, opišete šta se dešava — mi ga pogledamo i kažemo šta
                je kvar, koliko popravka košta i koliko traje. Tek kad se dogovorimo,
                telefon ide na sto.
              </p>
              <p>
                Radimo alatom i opremom za mikrolemljenje, pa se otvaranje ne završava
                novim ogrebotinama i pokidanim flet kablovima.
              </p>
              <p className="text-cream/60">
                Ne stižete do Novog Sada? Telefon se prima i kurirskom službom — vidi{" "}
                <a href="#kurir" className="font-semibold text-brand-400 hover:text-brand-500">
                  prijem kurirskom službom
                </a>
                .
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <KontaktDugmad layout="red" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <OpremaUzServis />
          </Reveal>
        </div>
      </section>

      {/* Usluge, razvijeno */}
      <section className="section border-t border-ink-600 bg-ink-800/40">
        <div className="container">
          <SectionHeading
            eyebrow="Usluge"
            title="Šta radimo i šta možete da očekujete"
          />

          <div className="mt-12 space-y-6">
            {usluge.map((u, i) => (
              <UslugaBlok key={u.key} usluga={u} delay={i === 0 ? 0 : 0.06} />
            ))}
          </div>
        </div>
      </section>

      {/* Česta pitanja */}
      <section className="section border-t border-ink-600">
        <div className="container">
          <SectionHeading
            align="center"
            eyebrow="Česta pitanja"
            title="Pitanja koja najčešće dobijamo"
            description="Ako odgovor nije tu, pitajte — javljamo se u toku radnog vremena."
          />

          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {faq.map((f) => (
              /*
                <details> namerno umesto akordeona u React-u: otvaranje pitanja
                ne zahteva ni bajt JavaScript-a, a radi i pre hidratacije.
              */
              <details
                key={f.q}
                className="group rounded-2xl border border-ink-600 bg-ink-800 px-5 py-4 shadow-card transition-colors open:border-brand/40"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-cream [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    aria-hidden
                    className="h-4 w-4 shrink-0 text-brand-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-cream/70">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Zaključni poziv */}
      <section className="section border-t border-ink-600 bg-ink-800/40">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <Reveal>
            <h2 className="max-w-xl text-3xl font-bold text-balance text-cream sm:text-4xl">
              Ne znate šta je kvar? Pitajte pre nego što krenete.
            </h2>
            <p className="mt-4 max-w-xl text-cream/70">
              Napišite model telefona i šta se dešava — kažemo šta je najverovatnije,
              koliko popravka košta i da li deo imamo. Slika ili snimak kvara pomažu
              više od bilo kog opisa.
            </p>
            <KontaktDugmad layout="red" className="mt-7" />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card">
              <div className="flex items-start gap-3">
                <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div>
                  <p className="font-semibold text-cream">Radnja</p>
                  <p className="text-sm text-cream/70">{site.address.full}</p>
                  <Link
                    href="/kontakt"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-400 hover:text-brand-500"
                  >
                    Mapa i uputstvo za dolazak
                    <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 border-t border-ink-600 pt-5">
                <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-cream">Radno vreme</p>
                  <ul className="mt-1.5 space-y-1 text-sm text-cream/70">
                    {site.hours.map((h) => (
                      <li key={h.day} className="flex justify-between gap-4">
                        <span>{h.day}</span>
                        <span className="font-medium text-cream/90">{h.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 border-t border-ink-600 pt-5">
                <p className="text-sm text-cream/70">
                  Delove i opremu koje ugrađujemo prodajemo i preko pulta — maske, stakla,
                  baterije, punjači i kablovi su u prodavnici, sa cenama.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link href="/prodavnica">
                    <Store aria-hidden className="h-4 w-4" />
                    Pogledaj prodavnicu
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ------------------------------ Podkomponente ----------------------------- */

/**
 * Jedan blok usluge. `id` je ključ usluge, pa se sa bilo kog mesta na sajtu
 * može linkovati direktno na uslugu (`/servis#podaci`); `scroll-mt` drži naslov
 * ispod fiksiranog header-a kad se skoči na taj anchor.
 */
function UslugaBlok({
  usluga,
  delay,
}: {
  usluga: Usluga;
  delay: number;
}) {
  const Ikonica = usluga.icon;
  const detalj = DETALJI[usluga.key];
  // Spašavanje podataka je i na flajeru izdvojeno amberom — jedina usluga koja
  // sme da preskoči plavu, jer je i najosetljivija.
  const amber = usluga.key === "podaci";

  return (
    <Reveal delay={delay}>
      <article
        id={usluga.key}
        className="scroll-mt-28 rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card md:p-9"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <span
            className={cn(
              "grid h-14 w-14 shrink-0 place-items-center rounded-2xl border",
              amber
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-brand/30 bg-brand/10 text-brand-400",
            )}
          >
            <Ikonica aria-hidden className="h-7 w-7" strokeWidth={1.6} />
          </span>

          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-balance text-cream">{usluga.title}</h3>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-cream/80">
              {usluga.description}
            </p>

            {detalj ? (
              <div className="mt-4 space-y-3 text-cream/70">
                {detalj.uvod.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            ) : null}

            {usluga.stavke ? (
              <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                {usluga.stavke.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-[0.95rem] text-cream/80">
                    <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}

            {detalj ? (
              <div
                className={cn(
                  "mt-6 flex gap-3 rounded-2xl border-l-2 bg-ink-700/60 px-4 py-3.5",
                  amber ? "border-accent" : "border-brand",
                )}
              >
                <Info
                  aria-hidden
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    amber ? "text-accent" : "text-brand-400",
                  )}
                />
                <p className="text-sm leading-relaxed text-cream/75">
                  <span className="font-semibold text-cream">Iskreno: </span>
                  {detalj.napomena}
                </p>
              </div>
            ) : null}

            <div className="mt-7 border-t border-ink-600 pt-6">
              <p className="text-sm text-muted-foreground">
                Dogovor ide direktno — javite se za ovu uslugu:
              </p>
              {/*
                Naziv usluge ulazi u predpopunjenu poruku iako je `inquiryFor`
                pisan za artikle: bitnije je da vlasnik iz prve poruke vidi o čemu
                je reč nego da rečenica bude idealna.
              */}
              <KontaktDugmad naziv={usluga.title} layout="red" className="mt-3" />
            </div>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Oprema uz servis                                */
/* -------------------------------------------------------------------------- */

/**
 * „Pored usluge servis posedujemo i opremu za telefone" — sedam stavki koje
 * vlasnik nabraja u svojoj ponudi.
 *
 * Namerno je izgrađeno kao UI, a NE kao slika: sadržaj mora da bude tekst koji
 * Google čita i koji se prelama na telefonu, a svaka stavka vodi u odgovarajuću
 * kategoriju prodavnice. Slika bi bila mrtav piksel bez ijednog linka.
 */
const OPREMA: { label: string; note?: string; icon: LucideIcon; href: string }[] = [
  { label: "Maske", icon: Smartphone, href: kategorijaHref("maske") },
  // Maske po želji se ne mogu naći u katalogu (rade se po porudžbini), pa
  // jedina tačna adresa za njih je kontakt — ne kategorija maski.
  { label: "Maske po želji", note: "sa vašom slikom", icon: Palette, href: "/kontakt" },
  { label: "Zaštitna stakla", icon: ShieldCheck, href: kategorijaHref("stakla") },
  { label: "Folije", icon: Layers, href: kategorijaHref("stakla") },
  { label: "Punjači", icon: Plug, href: kategorijaHref("punjaci") },
  { label: "Auto punjači", icon: Car, href: kategorijaHref("punjaci") },
  { label: "Kablovi", icon: Cable, href: kategorijaHref("kablovi") },
];

function OpremaUzServis() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-600 bg-ink-800 p-6 shadow-card sm:p-8">
      {/* Ista tekstura kao u hero-u — drži blok u istom vizualnom jeziku. */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:28px_28px] opacity-60" />

      <div className="relative">
        <span className="eyebrow">
          <span className="h-px w-6 bg-current" />
          Pored servisa
        </span>
        <h3 className="mt-3 text-2xl font-bold text-balance text-cream">
          U radnji imate i opremu za telefone
        </h3>
        <p className="mt-2 text-sm text-cream/70">
          Ako već dolazite na servis, uzmite i masku ili staklo — postavljamo ih na
          mestu, bez čekanja.
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {OPREMA.map(({ label, note, icon: Icon, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="group flex h-full flex-col gap-2 rounded-xl border border-ink-600 bg-ink-700/60 p-3 transition-colors hover:border-brand/50 hover:bg-ink-700"
              >
                <Icon
                  className="h-5 w-5 text-brand-400 transition-colors group-hover:text-brand-500"
                  strokeWidth={1.6}
                  aria-hidden
                />
                <span className="text-sm font-semibold leading-tight text-cream">
                  {label}
                </span>
                {note ? (
                  <span className="text-[0.7rem] leading-tight text-muted-foreground">
                    {note}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>

        <Button asChild variant="outline" size="sm" className="mt-6 w-full">
          <Link href="/prodavnica">
            Cela prodavnica
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
