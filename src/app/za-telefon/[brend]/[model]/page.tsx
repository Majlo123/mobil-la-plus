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
import {
  brendHref,
  kategorijaHref,
  modelHref,
  modelTipHref,
  prodavnicaHref,
} from "@/lib/catalog";
import { categories } from "@/lib/data";
import {
  PRAG_ZA_TIP_STRANU,
  getModel,
  getProductsByModelAndType,
  modelParams,
  modelsByBrand,
  tipoviZaModel,
  type ModelInfo,
  type Product,
} from "@/lib/products";
import { site } from "@/lib/site";
import { artikala, glavnaMarka, punNazivModela } from "@/lib/tekst";

/**
 * Strana modela telefona — „Sve za Galaxy S23".
 *
 * Ovo je strana zbog koje sloj modela uopšte postoji: kupac ne kuca „maske
 * Samsung" nego „maska za S23 Ultra", a strana marke je za taj upit pregruba
 * (Samsung ima preko trinaest hiljada artikala kroz dvesta modela). Ovde su svi
 * artikli JEDNOG modela, složeni po vrsti — dakle tačno ono što je kupac tražio,
 * plus ono što uz to ide (ko traži ekran, često uzme i staklo).
 *
 * Odnos prema susedima u ruti:
 *  - `/za-telefon/[brend]` je nivo iznad (sve marke artikala, po vrsti),
 *  - `/za-telefon/[brend]/[model]/[tip]` je nivo ispod i postoji samo za
 *    kombinacije sa bar `PRAG_ZA_TIP_STRANU` artikala. Zato se link ka njemu
 *    ovde daje USLOVNO — ka strani koja se ne generiše vodio bi 404.
 *
 * Vrste koje ne dobiju svoju stranu (jedan ili dva artikla za taj model) nisu
 * izgubljene: njihovi artikli stoje u vitrini ove strane, a chip ispod vodi na
 * `/prodavnica` sa već postavljenim filterom.
 */

/* Parametri dolaze iz kataloga — nepoznat model je 404, ne prazna strana. */
export const dynamicParams = false;

export function generateStaticParams() {
  return modelParams();
}

/* -------------------------------- Pomoćno --------------------------------- */

/** Koliko artikala ide u vitrinu jedne vrste. */
const U_GRUPI = 8;

/**
 * Koliko vrsta dobija mrežu kartica.
 *
 * Isti budžet kao na strani marke (6 × 8 = 48 kartica): popularan model ima
 * artikle u desetak vrsta, pa bi mreža za svaku bila strana od sto kartica, a
 * svaka kartica nosi sliku i četiri kontakt linka. Ostale vrste idu kao spisak
 * linkova ispod — nijedna ne ispada sa strane.
 */
const GRUPA_SA_KARTICAMA = 6;

/** Koliko srodnih modela iste marke se nudi na dnu strane. */
const SRODNIH_MODELA = 12;

/**
 * Vrste posle kojih sledi rad u servisu, a ne samo kupovina.
 *
 * Uže nego na strani marke (tamo su i „delovi"): ovde blok govori kupcu koji je
 * ukucao „ekran za …" ili „baterija za …" — a to su dve vrste kod kojih čovek
 * gotovo nikad ne traži deo za sebe, nego popravku telefona.
 */
const UZ_UGRADNJU = ["ekrani", "baterije"];

const broj = (n: number) => n.toLocaleString("sr-RS");

/**
 * Kratka reč za vrstu artikla („Maske i futrole" → „maske").
 *
 * Naslov strane mora da nosi reči kojima ljudi pretražuju, a puni nazivi vrsta
 * su predugački za `<title>`: tri puna naziva pojedu ceo prostor koji Google
 * prikaže. `short` iz `lib/data.ts` je već pisan za tesne prostore.
 */
function kratko(tipKey: string, rezerva: string): string {
  const naziv = categories.find((c) => c.key === tipKey)?.short ?? rezerva;
  return naziv.toLocaleLowerCase("sr");
}

type Grupa = {
  key: string;
  label: string;
  /** Ukupno artikala te vrste za OVAJ model (ne samo onih u vitrini). */
  count: number;
  /** Da li kombinacija model × vrsta ima svoju stranu (prag iz kataloga). */
  imaStranu: boolean;
  vitrina: Product[];
};

/**
 * Artikli modela, grupisani po vrsti. `tipoviZaModel` već vraća vrste sortirane
 * po broju, pa se ovde samo dopunjava vitrinom: prvo artikli sa fotografijom —
 * placeholder ploča („Fotografija uskoro") ne prodaje ništa — pa abecedno, da
 * redosled bude isti u svakom build-u.
 */
function grupeZaModel(modelKey: string): Grupa[] {
  return tipoviZaModel(modelKey).map((tip) => ({
    key: tip.key,
    label: tip.label,
    count: tip.count,
    imaStranu: tip.count >= PRAG_ZA_TIP_STRANU,
    vitrina: getProductsByModelAndType(modelKey, tip.key)
      .sort((a, b) => {
        const slika = Number(Boolean(b.image)) - Number(Boolean(a.image));
        return slika !== 0 ? slika : a.name.localeCompare(b.name, "sr");
      })
      .slice(0, U_GRUPI),
  }));
}

/**
 * Susedi po broju artikala unutar iste marke.
 *
 * Bez ovog bloka Googlebot do većine od 1.367 strana modela stiže samo preko
 * sitemap-a. Uzimaju se SUSEDI, a ne prvih dvanaest modela marke: kad bi svaka
 * strana linkovala na iste (najveće) modele, sve ostale bi ostale bez ijednog
 * ulaznog linka. Ovako se lanac linkova provuče kroz ceo spisak marke, a kupcu
 * su ponuđeni modeli sa sličnim obimom ponude (najčešće ista generacija).
 */
function srodniModeli(info: ModelInfo, limit: number): ModelInfo[] {
  const svi = modelsByBrand(info.brandKey);
  const mesto = svi.findIndex((m) => m.key === info.key);
  if (mesto < 0) return svi.slice(0, limit);

  // Prozor se pomera unazad kad je model pri kraju spiska, da poslednji modeli
  // ne dobiju upola prazan blok.
  const pola = Math.floor(limit / 2);
  const pocetak = Math.max(0, Math.min(mesto - pola, svi.length - (limit + 1)));
  return svi
    .slice(pocetak, pocetak + limit + 1)
    .filter((m) => m.key !== info.key)
    .slice(0, limit);
}

/* -------------------------------- Metadata -------------------------------- */

// Kad strana deklariše `openGraph`, roditeljski iz `layout.tsx` se ne nasleđuje
// — zato se slika ponavlja ovde (drugog OG vizuala i nemamo).
const OG_IMAGE = "/images/brend/logo.jpg";

/** Najzastupljenije vrste kao nabrajanje („maske, stakla i folije, ekrani"). */
const nabroj = (grupe: Grupa[], koliko = 3) =>
  grupe
    .slice(0, koliko)
    .map((g) => kratko(g.key, g.label))
    .join(", ");

/**
 * Model iz URL-a, uz proveru da je marka u putanji ona kanonska.
 *
 * Ključ modela ne nosi marku („galaxy-s23" ne kaže „samsung"), pa bi bez ove
 * provere `/za-telefon/apple/galaxy-s23` bio ista strana na drugoj adresi —
 * duplikat koji sami pravimo. `dynamicParams = false` to već seče u build-u, ali
 * provera stoji i ovde jer je jeftina, a greška u linku skupa.
 */
function modelIzPutanje(params: { brend: string; model: string }): ModelInfo | undefined {
  const info = getModel(params.model);
  return info && info.brandKey === params.brend && info.count > 0 ? info : undefined;
}

export function generateMetadata({
  params,
}: {
  params: { brend: string; model: string };
}): Metadata {
  const info = modelIzPutanje(params);
  if (!info) return {};

  const grupe = grupeZaModel(info.key);
  const canonical = modelHref(info.brandKey, info.key);
  const pun = punNazivModela(info);

  // Naslov nosi i vrste artikala, jer se tako i pretražuje: niko ne kuca
  // „oprema za Galaxy S23" nego „maska za Galaxy S23" ili „ekran za S23".
  // Najzastupljenije vrste su napred, grad pozadi — Google odseca kraj.
  const title = `Oprema i delovi za ${pun} — ${nabroj(grupe)} | ${site.address.city}`;
  const description = `${broj(info.count)} ${artikala(info.count)} za ${pun} sa cenom u dinarima — ${nabroj(grupe, 4)}. ${site.name}, ${site.address.city}.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${pun} — oprema i delovi | ${site.name}`,
      description,
      images: [{ url: OG_IMAGE, alt: `${site.name} — ${site.slogan}` }],
    },
  };
}

/* -------------------------------- Stranica -------------------------------- */

export default function ModelPage({
  params,
}: {
  params: { brend: string; model: string };
}) {
  const info = modelIzPutanje(params);
  if (!info) notFound();

  const pun = punNazivModela(info);
  // U rečenicama ide kratko ime marke („Apple"), a u putanji pun naziv iz
  // kataloga („Apple / iPhone") — putanja mora da se poklopi sa stranom marke.
  const marka = glavnaMarka(info.brandLabel);
  const grupe = grupeZaModel(info.key);
  const saKarticama = grupe.slice(0, GRUPA_SA_KARTICAMA);
  const ostaleVrste = grupe.slice(GRUPA_SA_KARTICAMA);
  const servisneVrste = grupe.filter((g) => UZ_UGRADNJU.includes(g.key));
  const srodni = srodniModeli(info, SRODNIH_MODELA);

  // Uvod nabraja vrste iz kataloga, a ne fiksnu listu: model za koji imamo samo
  // maske ne sme u prvoj rečenici da obeća ekrane i baterije.
  const uvod = `Sve što imamo za ovaj model na jednom mestu: ${nabroj(grupe, 4)} — po vrsti artikla i sa cenom u dinarima. Javite nam se da potvrdimo dostupnost.`;

  // Rečenica o servisu se slaže sa onim što za taj model zaista imamo: model sa
  // samo baterijama ne sme da dobije tekst o zameni ekrana.
  const servisniDeo =
    servisneVrste.length === 2
      ? "Ekran i bateriju"
      : servisneVrste[0]?.key === "ekrani"
        ? "Ekran"
        : "Bateriju";

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: info.brandLabel, href: brendHref(info.brandKey) },
          { naziv: info.label, href: modelHref(info.brandKey, info.key) },
        ]}
      />

      {/* Spisak prijavljuje artikle koji su i prikazani — vitrine grupa sa
          karticama, istim redom kojim stoje na strani. */}
      <SpisakJsonLd
        naziv={`Oprema i delovi za ${pun} — ${site.name}`}
        stavke={saKarticama.flatMap((g) => g.vitrina)}
        ukupno={info.count}
      />

      <PageHeader
        eyebrow={`${broj(info.count)} ${artikala(info.count)} za ${info.label}`}
        title={`Sve za ${pun}`}
        description={uvod}
      />

      <section className="section">
        <div className="container">
          {/* Vidljiva putanja (JSON-LD verzija je gore) — kupac koji uđe iz
              Google-a pravo na model mora da vidi gde je i kako da se popne na
              celu ponudu za svoju marku. */}
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
            <Link
              href={brendHref(info.brandKey)}
              className="transition-colors hover:text-brand-400"
            >
              {info.brandLabel}
            </Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <span className="font-medium text-cream">{info.label}</span>
          </nav>

          {/* Za razliku od strane marke, ovde poruka SME da bude predpopunjena:
              „delovi i oprema za Galaxy S23" je upit na koji vlasnik može da
              odgovori, dok bi isti upit za ceo Samsung bio besmislen. */}
          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-600 bg-ink-700 text-brand-400">
                <Smartphone className="h-5 w-5" strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-cream">
                  Ne vidite šta vam treba za {info.label}?
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Pišite nam koji deo ili opremu tražite — imamo i ono što nije
                  na sajtu, a odgovaramo isti dan.
                </p>
              </div>
            </div>
            <KontaktDugmad
              naziv={`delovi i oprema za ${pun}`}
              className="shrink-0"
            />
          </div>

          {servisneVrste.length > 0 ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              {/* Ko traži „ekran za …" najčešće ne traži deo nego popravku —
                  zato ovde stoji šta se sa tim delom radi kod nas, bez
                  izmišljenih specifikacija i rokova. */}
              <p className="flex items-start gap-2.5 text-sm text-cream/85">
                <Wrench aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {servisniDeo} za {pun} menjamo u našem servisu — {site.address.street},{" "}
                {site.address.city}. Ako niste u Novom Sadu, telefon nam možete
                poslati kurirskom službom, uz dogovor pre slanja.
              </p>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/servis">Usluge servisa</Link>
              </Button>
            </div>
          ) : null}

          {/* Brzi skok na vrstu — ujedno i spisak internih linkova na vrhu
              strane, pre nego što se dođe do mreža kartica. */}
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
            {saKarticama.map((g) => {
              const tipStrana = modelTipHref(info.brandKey, info.key, g.key);
              const naslov = `${g.label} za ${info.label}`;

              return (
                <section key={g.key} id={g.key} className="scroll-mt-28">
                  <Reveal>
                    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-600 pb-4">
                      <div>
                        {/* Naslov je link kad strana model × vrsta postoji:
                            „Ekrani i LCD za Galaxy S23" je najbolji mogući
                            tekst linka ka toj strani, a i kupcu je jasno gde
                            vodi. Kad vrsta nema svoju stranu (manje od praga),
                            naslov ostaje običan tekst — link bi bio 404. */}
                        <h2 className="font-display text-2xl font-bold text-cream md:text-[1.75rem]">
                          {g.imaStranu ? (
                            <Link
                              href={tipStrana}
                              className="transition-colors hover:text-brand-400"
                            >
                              {naslov}
                            </Link>
                          ) : (
                            naslov
                          )}
                        </h2>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {broj(g.count)} {artikala(g.count)} za {info.label} ·{" "}
                          <Link
                            href={kategorijaHref(g.key)}
                            aria-label={`Cela kategorija: ${g.label}`}
                            className="font-medium text-brand-400 hover:underline"
                          >
                            cela kategorija
                          </Link>
                        </p>
                      </div>
                      {/* Dugme se pojavljuje samo kad ima šta da se otvori —
                          a tada je vrsta sigurno iznad praga (vitrina prima
                          osam, prag je tri), pa link vodi na postojeću stranu. */}
                      {g.count > g.vitrina.length ? (
                        <Button asChild variant="outline" size="sm" className="shrink-0">
                          <Link href={tipStrana}>
                            Prikaži svih {broj(g.count)}
                            <ArrowRight aria-hidden className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </Reveal>

                  {/* Kartice nisu pojedinačno u `Reveal`: desetine framer
                      instanci na strani su skuplje od efekta koji donose. */}
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {g.vitrina.map((item) => (
                      <ProizvodKartica key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          {ostaleVrste.length > 0 ? (
            <Reveal className="mt-14">
              <div className="rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card">
                <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Još za {info.label}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ostaleVrste.map((g) => (
                    <Link
                      key={g.key}
                      // Vrsta ispod praga nema svoju stranu — tada chip vodi na
                      // prodavnicu sa već postavljenim filterom (model + vrsta),
                      // gde je tih par artikala odmah na ekranu.
                      href={
                        g.imaStranu
                          ? modelTipHref(info.brandKey, info.key, g.key)
                          : prodavnicaHref({ model: info.key, tip: g.key })
                      }
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
            Drugi {marka} modeli
          </h2>
          {srodni.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {srodni.map((m) => (
                <Link
                  key={m.key}
                  href={modelHref(m.brandKey, m.key)}
                  className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400"
                >
                  {m.label}
                  <span className="text-[0.7rem] tabular-nums text-muted-foreground">
                    {broj(m.count)}
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
          <p className="mt-6 text-sm text-muted-foreground">
            Ne vidite svoj model?{" "}
            <Link
              href={brendHref(info.brandKey)}
              className="font-medium text-brand-400 hover:underline"
            >
              Cela ponuda za {marka}
            </Link>{" "}
            ili{" "}
            <Link
              href={prodavnicaHref()}
              className="font-medium text-brand-400 hover:underline"
            >
              pretraga cele prodavnice
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
