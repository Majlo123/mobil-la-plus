import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Smartphone, Wrench } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { ProizvodKartica } from "@/components/ProizvodKartica";
import { PutanjaJsonLd } from "@/components/PutanjaJsonLd";
import { Reveal } from "@/components/Reveal";
import { SpisakJsonLd } from "@/components/SpisakJsonLd";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { brendHref, kategorijaHref, modelHref, prodavnicaHref } from "@/lib/catalog";
import {
  getProductsByBrand,
  modelsByBrand,
  productBrands,
  type ModelInfo,
  type Product,
} from "@/lib/products";
import { site } from "@/lib/site";
import { artikala } from "@/lib/tekst";

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

/* ------------------------------ Modeli marke ------------------------------- */

/**
 * Serija modela izvedena iz naziva („Galaxy S23 Ultra" → „Galaxy S").
 *
 * Samsung ima 317 modela — jedan spisak od 317 linkova je zid kroz koji niko ne
 * gleda, a spisak nam treba ceo, jer je ovo JEDINI interni put do 1.367 strana
 * modela. Zato se grupiše po onome što kupac i sam zna: seriji telefona.
 *
 * Serija se ne čita iz rečnika (koji je nema) nego iz naziva: sve reči do prve
 * koja sadrži cifru, plus slovni deo te reči — „Galaxy A54 5G" → „Galaxy A",
 * „Galaxy Note 20 Ultra" → „Galaxy Note", „Moto G5 Plus" → „Moto G", „P8 Lite"
 * → „P". Nazivi bez ijedne cifre („Galaxy Ace Plus") daju prve dve reči, pa
 * ostanu uz brojane rođake („Galaxy Ace 4").
 */
function serijaModela(label: string): string {
  const reci = label.split(/\s+/);
  const prvaSaCifrom = reci.findIndex((rec) => /\d/.test(rec));
  if (prvaSaCifrom === -1) return reci.slice(0, 2).join(" ");

  const slovniDeo = reci[prvaSaCifrom].replace(/\d.*$/, "");
  return [...reci.slice(0, prvaSaCifrom), slovniDeo].filter(Boolean).join(" ") || reci[0];
}

/**
 * Naslov grupe. Serija često ne nosi marku („P", „Galaxy A", „Blade A"), pa se
 * marka dodaje ispred — ali samo kad je već nema u seriji, da ne ispadne „Nokia
 * Nokia N". Poređenje ide po rečima jer nazivi marki umeju da budu složeni
 * („Apple / iPhone", „Xiaomi / Redmi / Poco"): za „iPhone" je marka suvišna, za
 * „iPad" nije.
 */
function naslovSerije(serija: string, brendLabel: string): string {
  const reciMarke = brendLabel.toLocaleLowerCase("sr").split(/[\s/]+/).filter(Boolean);
  const prvaRec = serija.split(/\s+/)[0].toLocaleLowerCase("sr");
  if (reciMarke.includes(prvaRec)) return serija;
  return `${brendLabel.split(/[\s/]+/)[0]} ${serija}`;
}

/** Ispod ovoliko modela serija nema svoje zaglavlje nego ide u „Ostali modeli". */
const MIN_U_SERIJI = 2;

/** Ključ zbirne grupe — nije naziv serije, pa ne može da se sudari sa pravim. */
const OSTALI = "|ostali";

type Serija = {
  key: string;
  naslov: string;
  /** Ukupno artikala kroz sve modele serije — po tome se serije i ređaju. */
  count: number;
  modeli: ModelInfo[];
};

/**
 * Modeli marke, složeni u serije. Redosled je isti kao svuda na sajtu — po
 * broju artikala opadajuće — pa serija za koju stvarno imamo asortiman stoji na
 * vrhu, a usamljeni modeli („Galaxy Nexus", „Galaxy Pocket") se skupljaju u
 * jednu grupu na dnu umesto da svaki dobije svoje zaglavlje.
 */
function serijeModela(modeli: ModelInfo[], brendLabel: string): Serija[] {
  const mapa = new Map<string, ModelInfo[]>();
  for (const m of modeli) {
    const kljuc = serijaModela(m.label);
    const grupa = mapa.get(kljuc);
    if (grupa) grupa.push(m);
    else mapa.set(kljuc, [m]);
  }

  const serije: Serija[] = [];
  const ostali: ModelInfo[] = [];
  for (const [kljuc, clanovi] of mapa) {
    if (clanovi.length < MIN_U_SERIJI) ostali.push(...clanovi);
    else
      serije.push({
        key: kljuc,
        naslov: naslovSerije(kljuc, brendLabel),
        count: clanovi.reduce((zbir, m) => zbir + m.count, 0),
        modeli: clanovi,
      });
  }

  serije.sort((a, b) => b.count - a.count || a.naslov.localeCompare(b.naslov, "sr"));

  if (ostali.length > 0) {
    serije.push({
      key: OSTALI,
      naslov: "Ostali modeli",
      count: ostali.reduce((zbir, m) => zbir + m.count, 0),
      modeli: ostali.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sr")),
    });
  }

  return serije;
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
  const serije = serijeModela(modelsByBrand(brend.key), brend.label);

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: brend.label, href: brendHref(brend.key) },
        ]}
      />

      {/* Spisak prijavljuje artikle koji su i prikazani — vitrine grupa sa
          karticama, istim redom kojim stoje na strani. */}
      <SpisakJsonLd
        naziv={`Oprema i delovi za ${brend.label} — ${site.name}`}
        stavke={saKarticama.flatMap((g) => g.vitrina)}
        ukupno={brend.count}
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
                  {serije.length > 0 ? (
                    <>
                      {" "}
                      Ili{" "}
                      <a href="#modeli" className="font-medium text-brand-400 hover:underline">
                        izaberite model sa spiska
                      </a>
                      .
                    </>
                  ) : null}
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

      {/*
        Spisak modela je istovremeno i navigacija za kupca („koji tačno telefon
        imate?") i jedini interni put do strana modela — zato su SVI modeli
        marke ovde kao pravi `<Link>`, bez „prikaži još" na klik. Grupisano po
        seriji, jer 317 Samsung modela u jednoj gomili niko ne čita.
      */}
      {serije.length > 0 ? (
        <section id="modeli" className="section scroll-mt-24 border-t border-ink-600">
          <div className="container">
            <SectionHeading
              eyebrow="Za koji model"
              title="Izaberite svoj model"
              description={`Broj pored modela je koliko artikala imamo baš za taj telefon. Ako vaš ${brend.label} nije na spisku, pišite nam — imamo i ono što nije na sajtu.`}
            />

            <div className="mt-8 space-y-8">
              {serije.map((s) => (
                <div key={s.key}>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {s.naslov}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.modeli.map((m) => (
                      <Link
                        key={m.key}
                        href={modelHref(m.brandKey, m.key)}
                        className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-3.5 py-1.5 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
                      >
                        {m.label}
                        <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                          {broj(m.count)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

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
