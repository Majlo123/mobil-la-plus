import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronRight, Package, Wrench } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { PageHeader } from "@/components/PageHeader";
import { Paginacija } from "@/components/Paginacija";
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
import { formatRsd, imaCenu } from "@/lib/pricing";
import {
  PRAG_ZA_TIP_STRANU,
  getModel,
  getProductsByModelAndType,
  modelTipParams,
  modelsByBrand,
  popularniModeliZaTip,
  tipoviZaModel,
  type Kategorija,
  type ModelInfo,
  type Product,
} from "@/lib/products";
import { parseUpit, type Upit } from "@/lib/shop-query";
import { site } from "@/lib/site";
import { artikala, punNazivModela } from "@/lib/tekst";

/**
 * Vrsta artikla za JEDAN model telefona — „Ekran za Samsung Galaxy S23",
 * „Maske za iPhone 13".
 *
 * Ovo je strana zbog koje ceo sloj modela i postoji. Kupac u Google ne kuca
 * „prodavnica opreme Novi Sad" nego „ekran za iphone 13 cena" i „maska za
 * samsung a54" — dakle VRSTA + MODEL, u jednini, često sa reči „cena". Nijedna
 * dosadašnja strana ne odgovara na taj upit: kategorija je prekrupna (21.967
 * maski), strana marke takođe (preko trinaest hiljada Samsung artikala), a
 * `/prodavnica` sa filterima nosi `noindex`. Ovde su tačno oni artikli koji su
 * kupcu potrebni, sa cenom i rasponom cena odmah na vrhu.
 *
 * Zato se i naslov piše onako kako se pretražuje (vidi `NASLOV_VRSTE`), a ne
 * onako kako se kategorija zove u meniju.
 *
 * Prave se samo kombinacije sa bar `PRAG_ZA_TIP_STRANU` artikala — obrazloženje
 * praga stoji uz samu konstantu u `src/lib/products.ts`.
 */

/*
 * Kombinacije ispod praga MORAJU biti 404, a ne prazna strana koja se izgenerše
 * na prvi zahtev: tanke strane koje Google jednom pokupi ostaju u indeksu kao
 * „Crawled – currently not indexed" i razblažuju ostatak sajta.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return modelTipParams();
}

/* -------------------------------- Pomoćno --------------------------------- */

/**
 * Koliko artikala ide na jednu stranu.
 *
 * Od 1.823 kombinacije samo 206 ima preko 24 artikla, a najveća (maske za
 * iPhone 15 Pro) ima 286 — sa 24 po strani (koliko ide `/prodavnica`) to bi
 * bilo dvanaest strana, od kojih jedanaest nosi `noindex`. Sa 48 ih je šest, a
 * to je isti budžet kartica kao vitrina kategorijske strane, koja se već
 * pokazala kao podnošljiva na mobilnom.
 */
const ARTIKALA_PO_STRANI = 48;

/** Vrste artikala posle kojih sledi rad u servisu, a ne samo prodaja. */
const UZ_UGRADNJU = ["ekrani", "baterije", "delovi"];

/**
 * Rep naslova za vrste sa ugradnjom — „cena i zamena" nije ista usluga kao
 * „cena i ugradnja": ekran i baterija se MENJAJU (stari deo izlazi), a servisni
 * deo se ugrađuje.
 */
const REP_NASLOVA: Record<string, string> = {
  ekrani: "cena i zamena",
  baterije: "cena i zamena",
  delovi: "cena i ugradnja",
};

/**
 * Kako se vrsta zove u naslovu — ONAKO KAKO SE KUCA U PRETRAGU, a ne kako se
 * kategorija zove u meniju.
 *
 * Niko ne traži „Ekrani i LCD za Galaxy S23" nego „ekran za galaxy s23": vrste
 * koje se kupuju po komadu (ekran, baterija, punjač) idu u jednini, a one iz
 * kojih se bira (maske, stakla, kablovi) u množini. Ključ koji ovde nedostaje
 * pada nazad na naziv kategorije iz kataloga, pa nova vrsta artikla ne ruši
 * stranu — samo dobije duži naslov.
 */
const NASLOV_VRSTE: Record<string, string> = {
  maske: "Maske",
  stakla: "Zaštitna stakla",
  punjaci: "Punjač",
  kablovi: "Kablovi",
  baterije: "Baterija",
  ekrani: "Ekran",
  audio: "Slušalice i zvučnici",
  powerbank: "Power bank",
  satovi: "Pametni satovi",
  memorije: "Memorijska kartica",
  delovi: "Delovi",
  ostalo: "Oprema",
};

const broj = (n: number) => n.toLocaleString("sr-RS");

/**
 * Naslovna fraza strane — „Ekran za Samsung Galaxy S23".
 *
 * Vrsta „telefoni" je izuzetak: tu je model sam artikal, pa „Telefon za Nokia
 * 105" nema smisla — naslov je onda samo naziv modela.
 */
function naslovnaFraza(tipKey: string, katLabel: string, nazivModela: string): string {
  if (tipKey === "telefoni") return nazivModela;
  return `${NASLOV_VRSTE[tipKey] ?? katLabel} za ${nazivModela}`;
}

type Raspon = { min: number; max: number; bezCene: number };

/**
 * Raspon cena — ono zbog čega se klikće iz rezultata pretrage: kupac koji kuca
 * „ekran za iphone 13 cena" traži broj, a ne opis prodavnice.
 *
 * Artikli bez cene („Cena na upit") se ne uračunavaju u raspon, ali se broje,
 * da se uz raspon može pošteno napisati koliko ih je van njega.
 */
function rasponCena(items: Product[]): Raspon | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let bezCene = 0;

  for (const p of items) {
    if (!imaCenu(p.price)) {
      bezCene += 1;
      continue;
    }
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
  }
  return min <= max ? { min, max, bezCene } : null;
}

/**
 * Redosled artikala: prvo oni sa fotografijom (placeholder ploča „Fotografija
 * uskoro" ne prodaje ništa i ne sme da drži prvi ekran), pa od najjeftinijeg —
 * jer je cena razlog dolaska na ovu stranu. Artikli bez cene idu na kraj svoje
 * grupe, a naziv je poslednji kriterijum da redosled bude isti u svakom build-u.
 */
function poredak(items: Product[]): Product[] {
  return items.sort((a, b) => {
    const slika = Number(Boolean(b.image)) - Number(Boolean(a.image));
    if (slika !== 0) return slika;
    if (a.price === null && b.price !== null) return 1;
    if (b.price === null && a.price !== null) return -1;
    if (a.price !== null && b.price !== null && a.price !== b.price) return a.price - b.price;
    return a.name.localeCompare(b.name, "sr");
  });
}

/**
 * Srodni modeli za istu vrstu artikla — „ekran za neki drugi Samsung".
 *
 * Prvo modeli ISTE marke, redom kojim ih daje `modelsByBrand` (najzastupljeniji
 * prvi): kupac koji gleda ekran za Galaxy S23 najverovatnije greši u tome koji
 * S ima, a ne u tome da ima Samsung. Ako marka nema dovoljno modela sa ovom
 * vrstom (Gigaset ima dva modela ukupno), spisak se dopunjava najtraženijim
 * modelima te vrste iz celog kataloga — bolje i tuđa marka nego prazan blok bez
 * ijednog internog linka.
 *
 * Vraćaju se samo modeli iznad praga, jer se ispod praga strana ne generiše i
 * link bi bio 404. `count` je broj artikala TE VRSTE za taj model — isti broj
 * koji stoji uz link.
 */
function srodniModeli(info: ModelInfo, tipKey: string, limit: number): ModelInfo[] {
  const nadjeni: ModelInfo[] = [];

  for (const m of modelsByBrand(info.brandKey)) {
    if (nadjeni.length >= limit) break;
    if (m.key === info.key) continue;
    const koliko = getProductsByModelAndType(m.key, tipKey).length;
    if (koliko < PRAG_ZA_TIP_STRANU) continue;
    nadjeni.push({ ...m, count: koliko });
  }

  if (nadjeni.length < limit) {
    const vec = new Set(nadjeni.map((m) => m.key));
    for (const m of popularniModeliZaTip(tipKey, limit * 2)) {
      if (nadjeni.length >= limit) break;
      if (m.key === info.key || vec.has(m.key)) continue;
      nadjeni.push(m);
    }
  }
  return nadjeni;
}

/* --------------------------- Podaci jedne strane --------------------------- */

type Params = { brend: string; model: string; tip: string };
type SearchParams = Record<string, string | string[] | undefined>;

type Podaci = {
  info: ModelInfo;
  /** Pun naziv modela sa markom — „Samsung Galaxy S23". */
  naziv: string;
  /** Vrsta artikla sa brojem artikala TE vrste za TAJ model. */
  kat: Kategorija;
  artikli: Product[];
  cene: Raspon | null;
  ugradnja: boolean;
};

/**
 * Sve što i `generateMetadata` i sama strana moraju da znaju — na jednom mestu,
 * da se naslov i sadržaj ne mogu raziđi.
 *
 * Marka iz URL-a mora da bude KANONSKA marka modela (`info.brandKey`), a ne
 * bilo koja: bez te provere bi `/za-telefon/apple/galaxy-s23/ekrani` prikazao
 * istu stranu kao `/za-telefon/samsung/galaxy-s23/ekrani` i sam sebi napravio
 * duplikat u indeksu.
 */
function podaci(params: Params): Podaci | null {
  const info = getModel(params.model);
  if (!info || info.brandKey !== params.brend) return null;

  const kat = tipoviZaModel(info.key).find((v) => v.key === params.tip);
  if (!kat || kat.count < PRAG_ZA_TIP_STRANU) return null;

  const artikli = poredak(getProductsByModelAndType(info.key, params.tip));
  return {
    info,
    naziv: punNazivModela(info),
    kat,
    artikli,
    cene: rasponCena(artikli),
    ugradnja: UZ_UGRADNJU.includes(params.tip),
  };
}

/** Broj strane iz URL-a; sve ostalo iz `searchParams` se namerno ignoriše. */
const brojStraneIz = (searchParams: SearchParams) => parseUpit(searchParams).strana;

/* -------------------------------- Metadata -------------------------------- */

// Kad strana deklariše `openGraph`, roditeljski iz `layout.tsx` se ne nasleđuje
// — zato se slika ponavlja ovde (drugog OG vizuala i nemamo).
const OG_IMAGE = "/images/brend/logo.jpg";

/**
 * Rep naslova. Kod vrsta sa ugradnjom ide usluga („cena i zamena"), jer se za
 * njih i pretražuje zajedno sa radom; kod ostalih ide najniža cena, koja je
 * jedina informacija zbog koje se u rezultatu klikne baš na nas.
 */
function repNaslova(p: Podaci): string {
  const uslugom = REP_NASLOVA[p.kat.key];
  if (uslugom) return uslugom;
  return p.cene ? `cene od ${formatRsd(p.cene.min)}` : "ponuda i cene";
}

/**
 * Način kupovine u opisu — kupac iz pretrage ne zna da nemamo korpu, pa mu se
 * odmah u rezultatu kaže kako se do artikla dolazi.
 *
 * Grad ide u zagradi, a ne u rečenicu („u Novi Sadu"): u `site.ts` stoji u
 * nominativu, kao i svuda drugde na sajtu, a padež se ne sme izvoditi kodom.
 */
function nacinKupovine(p: Podaci): string {
  return p.ugradnja
    ? `Ugradnja u našem servisu (${site.address.city}), upit na Viber ili WhatsApp, slanje kurirom.`
    : `Upit na Viber ili WhatsApp, preuzimanje u radnji (${site.address.city}) ili slanje kurirom.`;
}

export function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Metadata {
  const p = podaci(params);
  if (!p) return {};

  const fraza = naslovnaFraza(p.kat.key, p.kat.label, p.naziv);
  const canonical = modelTipHref(p.info.brandKey, p.info.key, p.kat.key);
  const title = `${fraza} — ${repNaslova(p)}, ${site.address.city}`;

  const uzCenu = p.cene
    ? p.cene.min === p.cene.max
      ? `cena ${formatRsd(p.cene.max)}`
      : `cene od ${broj(p.cene.min)} do ${formatRsd(p.cene.max)}`
    : "cena na upit";
  const description = `${fraza} — ${broj(p.kat.count)} ${artikala(p.kat.count)}, ${uzCenu}. ${nacinKupovine(p)}`;

  // Strana 2+ je isti asortiman u drugom preseku: canonical ostaje na prvoj, a
  // sama strana ne ide u indeks — isto pravilo koje već važi za `/prodavnica` i
  // filtrirane kategorije. `follow` ostaje, da se do artikala ipak dođe.
  const prva = brojStraneIz(searchParams) <= 1;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: prva, follow: true },
    openGraph: {
      type: "website",
      url: canonical,
      title: `${fraza} | ${site.name}`,
      description,
      images: [{ url: OG_IMAGE, alt: `${site.name} — ${site.slogan}` }],
    },
  };
}

/* -------------------------------- Stranica -------------------------------- */

const CHIP =
  "inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800 px-4 py-2 text-sm text-cream/85 transition-colors hover:border-brand-500 hover:text-brand-400";
const CHIP_BROJ = "text-[0.7rem] tabular-nums text-muted-foreground";

/** Koliko srodnih modela ide u podnožje — jedan red do dva na širokom ekranu. */
const SRODNIH_MODELA = 12;

export default function ModelTipPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const p = podaci(params);
  if (!p) notFound();

  const { info, naziv, kat, artikli, cene, ugradnja } = p;
  const fraza = naslovnaFraza(kat.key, kat.label, naziv);
  const putanjaModela = modelHref(info.brandKey, info.key);

  const brojStrana = Math.max(1, Math.ceil(artikli.length / ARTIKALA_PO_STRANI));
  const tekuca = Math.min(brojStraneIz(searchParams), brojStrana);
  const prvi = (tekuca - 1) * ARTIKALA_PO_STRANI;
  const naStrani = artikli.slice(prvi, prvi + ARTIKALA_PO_STRANI);

  /*
   * Paginacija je zajednička sa prodavnicom, pa traži pun `Upit`. Ovde se
   * prosleđuje prazan: model i vrsta su već u putanji, a filteri iz URL-a se na
   * ovoj strani ne primenjuju — svaka faseta bi napravila novu adresu sa istim
   * artiklima, a to je tačno ono od čega ova strana beži.
   */
  const upit: Upit = { izbor: {}, q: "", sort: "naziv", strana: tekuca };

  const ostaleVrste = tipoviZaModel(info.key).filter((v) => v.key !== kat.key);
  const srodni = srodniModeli(info, kat.key, SRODNIH_MODELA);

  return (
    <>
      <PutanjaJsonLd
        stavke={[
          { naziv: "Prodavnica", href: "/prodavnica" },
          { naziv: info.brandLabel, href: brendHref(info.brandKey) },
          { naziv, href: putanjaModela },
          { naziv: kat.label, href: modelTipHref(info.brandKey, info.key, kat.key) },
        ]}
      />

      {/* Spisak se prijavljuje samo na prvoj strani — jedinoj koja ide u indeks
          (vidi `robots`). `ukupno` je ceo presek, ne samo prikazana strana. */}
      {tekuca === 1 ? (
        <SpisakJsonLd
          naziv={`${fraza} — ${site.name}, ${site.address.city}`}
          stavke={naStrani}
          ukupno={kat.count}
        />
      ) : null}

      <PageHeader
        eyebrow={`${broj(kat.count)} ${artikala(kat.count)} u ponudi`}
        title={fraza}
        description={
          ugradnja
            ? `Prodajemo i ugrađujemo — zamena se radi u našem servisu na adresi ${site.address.street}, ${site.address.city}. Javite se sa modelom da potvrdimo dostupnost i dogovorimo termin.`
            : `Cene su maloprodajne, u dinarima. Preuzimanje u radnji na adresi ${site.address.street}, ${site.address.city}, ili slanje kurirskom službom širom Srbije.`
        }
      />

      <section className="section pt-10 md:pt-12">
        <div className="container">
          {/* Vidljiva putanja (JSON-LD verzija je gore) — ovo je najdublja strana
              na sajtu i kupac na nju upada pravo iz Google-a, pa mora da vidi i
              gde je, i kako da se popne na „sve za taj telefon". */}
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
            <Link href={brendHref(info.brandKey)} className="transition-colors hover:text-brand-400">
              {info.brandLabel}
            </Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <Link href={putanjaModela} className="transition-colors hover:text-brand-400">
              {naziv}
            </Link>
            <ChevronRight aria-hidden className="h-3.5 w-3.5" />
            <span className="font-medium text-cream">{kat.label}</span>
          </nav>

          {/* Raspon cena + kontakt u istoj ploči, odmah ispod putanje: cena je
              razlog dolaska, a kontakt jedini način kupovine — kupac ne treba da
              skroluje kroz 48 kartica ni do jednog ni do drugog. Poruka se
              predpopunjava i vrstom i modelom, pa vlasniku stigne upit na koji
              može odmah da odgovori. */}
          <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-ink-600 bg-ink-800 p-5 shadow-card md:flex-row md:items-center md:justify-between md:gap-6">
            <div>
              {cene ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Cena u radnji
                  </p>
                  <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-cream md:text-[1.75rem]">
                    {cene.min === cene.max ? (
                      formatRsd(cene.max)
                    ) : (
                      <>
                        od {broj(cene.min)} do {formatRsd(cene.max)}
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {broj(kat.count)} {artikala(kat.count)} za {naziv}
                    {cene.bezCene > 0 ? (
                      <> · još {broj(cene.bezCene)} po dogovoru</>
                    ) : null}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-cream">Cena na upit</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Za ove artikle cenu potvrđujemo porukom — javite se i odgovaramo isti dan.
                  </p>
                </>
              )}
            </div>
            <KontaktDugmad naziv={fraza} className="shrink-0" />
          </div>

          {ugradnja ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-brand/25 bg-brand/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2.5 text-sm text-cream/85">
                <Wrench aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                {/* Bez roda i broja u rečenici („ekran se menja" / „delovi se
                    menjaju") — nazivi vrsta su raznog roda, pa se ide na oblik
                    koji radi za sve. */}
                Ugradnju za {naziv} radimo u našem servisu — {site.address.street},{" "}
                {site.address.city}. Donesite telefon ili nas prvo pozovite za procenu.
              </p>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href="/servis">Usluge servisa</Link>
              </Button>
            </div>
          ) : null}

          {/* Ostale vrste za isti model — drugi red pretrage istog kupca („imam
              S23, treba mi i staklo"). Vrste ispod praga nemaju svoju stranu, pa
              vode na prodavnicu sa već postavljenim filterom umesto na 404. */}
          {ostaleVrste.length > 0 ? (
            <nav aria-label={`Ostalo za ${naziv}`} className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Još za {naziv}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {ostaleVrste.map((v) => (
                  <Link
                    key={v.key}
                    href={
                      v.count >= PRAG_ZA_TIP_STRANU
                        ? modelTipHref(info.brandKey, info.key, v.key)
                        : prodavnicaHref({ model: info.key, tip: v.key })
                    }
                    className={CHIP}
                  >
                    {v.label}
                    <span className={CHIP_BROJ}>{broj(v.count)}</span>
                  </Link>
                ))}
              </div>
            </nav>
          ) : null}

          <p className="mt-8 text-sm text-muted-foreground">
            Prikazano{" "}
            <span className="font-semibold text-cream">
              {broj(prvi + 1)}–{broj(prvi + naStrani.length)}
            </span>{" "}
            od <span className="font-semibold text-cream">{broj(artikli.length)}</span>{" "}
            {artikala(artikli.length)}
            {brojStrana > 1 ? (
              <>
                {" "}
                · strana {tekuca} od {brojStrana}
              </>
            ) : null}
          </p>

          {/* Puna lista, ne vitrina: presek model × vrsta je već dovoljno uzak da
              kupac hoće da vidi SVE što imamo za svoj telefon. Kartice nisu
              pojedinačno u `Reveal` — desetine framer instanci su skuplje od
              efekta koji donose. */}
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {naStrani.map((item) => (
              <ProizvodKartica key={item.id} item={item} />
            ))}
          </div>

          <Paginacija
            upit={upit}
            tekuca={tekuca}
            strana={brojStrana}
            basePath={modelTipHref(info.brandKey, info.key, kat.key)}
          />

          <Reveal className="mt-12">
            <div className="flex flex-col gap-4 rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-ink-600 bg-ink-700 text-brand-400">
                  <Package className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-cream">Sve za {naziv}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Maske, stakla, baterije i delovi za isti telefon — na jednoj strani.
                  </p>
                </div>
              </div>
              <Button asChild size="md" className="shrink-0">
                <Link href={putanjaModela}>
                  Otvori
                  <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {srodni.length > 0 ? (
        <section className="section border-t border-ink-600 bg-ink-800/40">
          <div className="container">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {kat.label} za druge modele
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {srodni.map((m) => (
                <Link
                  key={m.key}
                  href={modelTipHref(m.brandKey, m.key, kat.key)}
                  className={CHIP}
                >
                  {punNazivModela(m)}
                  <span className={CHIP_BROJ}>{broj(m.count)}</span>
                </Link>
              ))}
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Ne vidite svoj model?{" "}
              <Link
                href={kategorijaHref(kat.key)}
                className="font-medium text-brand-400 hover:underline"
              >
                Cela kategorija: {kat.label}
              </Link>{" "}
              ili nam napišite tačan model — imamo i ono što nije na sajtu.
            </p>
          </div>
        </section>
      ) : null}
    </>
  );
}
