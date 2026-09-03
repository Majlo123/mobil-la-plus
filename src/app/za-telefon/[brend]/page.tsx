import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Smartphone, Wrench } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { ProizvodKartica } from "@/components/ProizvodKartica";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { brendHref, kategorijaHref, prodavnicaHref } from "@/lib/catalog";
import {
  getProductsByBrand,
  productBrands,
  type Product,
} from "@/lib/products";
import { site } from "@/lib/site";

/**
 * Strana po brendu telefona — „sve za Samsung", „sve za iPhone".
 *
 * Ovo je drugi ugao istog kataloga: `/kategorija/[tip]` odgovara na „gde ima
 * kaljenih stakala", ova strana na „šta imate za moj telefon" — a ljudi
 * pretražuju upravo tako („maska za Redmi Note 12"). Kanonska je i indeksabilna,
 * dok `/prodavnica?brend=…` nosi `noindex`, pa Google interne linkove ka
 * artiklima dobija odavde.
 *
 * Grupisano je po vrsti artikla jer je to jedini red koji kupcu nešto znači:
 * trinaest hiljada Samsung artikala u jednoj mreži je zid, a „Maske · Stakla ·
 * Baterije" je polica.
 */

/* Ključevi dolaze iz kataloga — nepoznat brend je 404, ne prazna strana. */
export const dynamicParams = false;

export function generateStaticParams() {
  return productBrands().map((b) => ({ brend: b.key }));
}

/* -------------------------------- Pomoćno --------------------------------- */

/** Koliko artikala ide u vitrinu jedne vrste. */
const U_GRUPI = 8;

/**
 * Koliko vrsta dobija mrežu kartica.
 *
 * Samsung ima 12 vrsta artikala; sa mrežom za svaku bila bi to strana od blizu
 * sto kartica, svaka sa slikom i četiri kontakt linka. Šest grupa je isti
 * budžet kao vitrina na kategorijskoj strani (48 kartica), a većina brendova
 * ionako ima šest ili manje vrsta — kod njih se ne odseca ništa. Ostatak ide
 * kao spisak linkova ispod, da nijedna vrsta ne ispadne sa strane.
 */
const GRUPA_SA_KARTICAMA = 6;

/** Vrste artikala posle kojih sledi rad u servisu (ne samo prodaja). */
const UZ_UGRADNJU = ["ekrani", "baterije", "delovi"];

const broj = (n: number) => n.toLocaleString("sr-RS");

/**
 * Srpska množina — brendovi idu od dva artikla (iPro) do preko trinaest hiljada
 * (Samsung), pa bez ovoga u naslovu piše „2 artikala". Isti helper stoji i na
 * kategorijskoj strani; pri sledećem dodiru na `src/lib` seli se tamo.
 */
function artikala(n: number): string {
  const jedinice = n % 10;
  const desetice = n % 100;
  if (jedinice === 1 && desetice !== 11) return "artikal";
  if (jedinice >= 2 && jedinice <= 4 && (desetice < 12 || desetice > 14)) return "artikla";
  return "artikala";
}

type Grupa = {
  key: string;
  label: string;
  /** Ukupno artikala te vrste za ovaj brend (ne samo onih u vitrini). */
  count: number;
  vitrina: Product[];
};

/**
 * Artikli brenda, grupisani po vrsti. U vitrinu svake grupe idu prvo oni sa
 * fotografijom — placeholder ploča („Fotografija uskoro") ne prodaje ništa —
 * pa abecedno, da redosled bude isti u svakom build-u.
 */
function grupePoVrsti(items: Product[]): Grupa[] {
  const mapa = new Map<string, { label: string; items: Product[] }>();
  for (const p of items) {
    const grupa = mapa.get(p.typeKey);
    if (grupa) grupa.items.push(p);
    else mapa.set(p.typeKey, { label: p.typeLabel, items: [p] });
  }

  return [...mapa.entries()]
    .map(([key, { label, items: svi }]) => ({
      key,
      label,
      count: svi.length,
      vitrina: [...svi]
        .sort((a, b) => {
          const slika = Number(Boolean(b.image)) - Number(Boolean(a.image));
          return slika !== 0 ? slika : a.name.localeCompare(b.name, "sr");
        })
        .slice(0, U_GRUPI),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sr"));
}

/* -------------------------------- Metadata -------------------------------- */

// Kad strana deklariše `openGraph`, roditeljski iz `layout.tsx` se ne nasleđuje
// — zato se slika ponavlja ovde (drugog OG vizuala i nemamo).
const OG_IMAGE = "/images/brend/logo.jpg";

/**
 * Najzastupljenije vrste za taj brend, kao nabrajanje u meta opisu — tačno za
 * svaku stranu, umesto opšteg „oprema i delovi" na sva 23 brenda.
 *
 * Prvi naziv zadržava veliko slovo (počinje rečenicu), ostalima se spušta samo
 * prvo slovo — `toLocaleLowerCase` nad celim nazivom bi od „Ekrani i LCD"
 * napravio „ekrani i lcd".
 */
const nabroj = (grupe: Grupa[], koliko = 3) =>
  grupe
    .slice(0, koliko)
    .map((g, i) =>
      i === 0 ? g.label : g.label.charAt(0).toLocaleLowerCase("sr") + g.label.slice(1),
    )
    .join(", ");

export function generateMetadata({
  params,
}: {
  params: { brend: string };
}): Metadata {
  const brend = productBrands().find((b) => b.key === params.brend);
  if (!brend) return {};

  const grupe = grupePoVrsti(getProductsByBrand(brend.key));
  const canonical = brendHref(brend.key);
  const title = `Oprema i delovi za ${brend.label} — Novi Sad`;
  // Opis staje u ~160 znakova koliko Google prikazuje: tri vrste artikla, broj
  // i grad. Sve preko toga se u rezultatu ionako odseca na pola reči.
  const description = `${nabroj(grupe)} za ${brend.label} — ${broj(brend.count)} ${artikala(brend.count)} sa cenom u dinarima. ${site.name}, ${site.address.city}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${brend.label} — oprema i delovi | ${site.name}`,
      description,
      images: [{ url: OG_IMAGE, alt: `${site.name} — ${site.slogan}` }],
    },
  };
}

/* -------------------------------- Stranica -------------------------------- */

export default function BrendPage({ params }: { params: { brend: string } }) {
  const brend = productBrands().find((b) => b.key === params.brend);
  if (!brend) notFound();

  const grupe = grupePoVrsti(getProductsByBrand(brend.key));
  const saKarticama = grupe.slice(0, GRUPA_SA_KARTICAMA);
  const ostaleVrste = grupe.slice(GRUPA_SA_KARTICAMA);
  const imaServis = grupe.some((g) => UZ_UGRADNJU.includes(g.key));
  const drugiBrendovi = productBrands().filter((b) => b.key !== brend.key);

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: brend.label, href: brendHref(brend.key) },
        ]}
      />

      <PageHeader
        eyebrow={`${broj(brend.count)} ${artikala(brend.count)} za ${brend.label}`}
        title={`Oprema i delovi za ${brend.label}`}
        description={`Sve što imamo za telefone ${brend.label} na jednom mestu — po vrsti artikla, sa cenom u dinarima. Recite nam tačan model i potvrdimo dostupnost.`}
      />

      <section className="section">
        <div className="container">
          {/* Vidljiva putanja (JSON-LD verzija je gore) — kupac koji uđe iz
              Google-a mora da zna gde je i kako da se vrati u celu prodavnicu. */}
          <nav
            aria-label="Putanja"
            className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-brand-400">
              Početna
            </Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <Link href="/prodavnica" className="transition-colors hover:text-brand-400">
              Prodavnica
            </Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <span className="font-medium text-cream">{brend.label}</span>
          </nav>

          {/* Kontakt odmah ispod putanje. Bez `naziv`: na strani brenda nema
              jednog artikla, a predpopunjeno „da li je dostupno?" za ceo
              Samsung bi vlasniku stiglo kao besmislica — konkretan upit ide sa
              kartice. Poenta poruke je model, jer se ponuda po modelima i deli. */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-600 bg-ink-700 text-brand-400">
                <Smartphone className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-cream">Koji model imate?</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Napišite nam tačan model {brend.label} telefona — imamo i ono
                  što nije na sajtu, a odgovaramo isti dan.
                </p>
              </div>
            </div>
            <KontaktDugmad className="shrink-0" />
          </div>

          {imaServis ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2.5 text-sm text-cream/85">
                <Wrench aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                Ekrane i baterije za {brend.label} menjamo u našem servisu —{" "}
                {site.address.street}, {site.address.city}.
              </p>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/servis">Usluge servisa</Link>
              </Button>
            </div>
          ) : null}

          {/* Brzi skok na vrstu — na strani sa šest mreža je sadržaj strane
              korisniji od skrolovanja, a ujedno je i lista internih linkova. */}
          {saKarticama.length > 1 ? (
            <nav aria-label="Vrste artikala na strani" className="mt-8 flex flex-wrap gap-2">
              {saKarticama.map((g) => (
                <a
                  key={g.key}
                  href={`#${g.key}`}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-3.5 py-1.5 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
                >
                  {g.label}
                  <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                    {broj(g.count)}
                  </span>
                </a>
              ))}
            </nav>
          ) : null}

          {/* Grupe po vrsti artikla */}
          <div className="mt-12 space-y-14">
            {saKarticama.map((g) => (
              <section key={g.key} id={g.key} className="scroll-mt-28">
                <Reveal>
                  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-600 pb-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-cream md:text-[1.75rem]">
                        {g.label} za {brend.label}
                      </h2>
                      {/* „cela kategorija" bez naziva u tekstu: nazivi vrsta su
                          raznog roda i broja („Punjači", „Zaštitna stakla i
                          folije"), pa svaka duža formulacija razbija slaganje.
                          Naziv je u naslovu iznad, a čitač ekrana ga dobija iz
                          `aria-label`. */}
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {broj(g.count)} {artikala(g.count)} za {brend.label} ·{" "}
                        <Link
                          href={kategorijaHref(g.key)}
                          aria-label={`Cela kategorija: ${g.label}`}
                          className="font-medium text-brand-400 hover:underline"
                        >
                          cela kategorija
                        </Link>
                      </p>
                    </div>
                    {g.count > g.vitrina.length ? (
                      <Button asChild variant="outline" size="sm" className="shrink-0">
                        <Link href={prodavnicaHref({ brend: brend.key, tip: g.key })}>
                          Prikaži sve
                          <ArrowRight aria-hidden className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </Reveal>

                {/* Kartice nisu pojedinačno u `Reveal`: desetine framer instanci
                    na strani su skuplje od efekta koji donose. */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {g.vitrina.map((item) => (
                    <ProizvodKartica key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {ostaleVrste.length > 0 ? (
            <Reveal className="mt-14">
              <div className="rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Još za {brend.label}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ostaleVrste.map((g) => (
                    <Link
                      key={g.key}
                      href={prodavnicaHref({ brend: brend.key, tip: g.key })}
                      className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-700 px-4 py-2 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
                    >
                      {g.label}
                      <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                        {broj(g.count)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          ) : null}
        </div>
      </section>

      <section className="section border-t border-ink-600 bg-ink-800/40">
        <div className="container">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Oprema za druge telefone
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {drugiBrendovi.map((b) => (
              <Link
                key={b.key}
                href={brendHref(b.key)}
                className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
              >
                {b.label}
                <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                  {broj(b.count)}
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Univerzalna oprema (punjači, kablovi, power bank) nije vezana za
            brend —{" "}
            <Link
              href="/prodavnica"
              className="font-medium text-brand-400 hover:underline"
            >
              pretražite celu prodavnicu
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
