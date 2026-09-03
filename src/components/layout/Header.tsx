import Link from "next/link";
import { Menu, Phone, Search, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { kategorijaHref } from "@/lib/catalog";
import { categories } from "@/lib/data";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Zaglavlje sajta — SERVER komponenta, bez ijednog bajta JS-a na klijentu.
 *
 * Zašto bez JS-a: header je jedina komponenta koja se učita na SVAKOJ strani,
 * a katalog ima preko 10.000 artikala — mobilni korisnik prvo mora da dobije
 * sadržaj, ne hidrataciju menija. Sve tri interaktivne stvari u headeru rade
 * nativno:
 *   - mobilni meni  → <details>/<summary> (disclosure koji browser sam vodi),
 *   - pretraga      → <form method="get"> koji vodi na /prodavnica?q=…,
 *   - navigacija    → obični linkovi.
 *
 * Cena te odluke, svesno prihvaćena:
 *   - nema podebljane „aktivne" stranice u meniju (za to treba `usePathname`);
 *     orijentaciju nose <PageHeader> naslov i putanja na samoj strani,
 *   - staklo je uvek uključeno umesto da se pojavi na skrolu — skrol listener
 *     bi značio klijentsku komponentu radi jedne senke.
 */

/* ------------------------------- Pretraga ---------------------------------- */

/**
 * Pretraga kataloga. Namerno običan GET form: browser sam sastavi
 * `/prodavnica?q=…`, isti onaj URL koji `parseUpit` čita na serveru — dakle
 * radi i bez JS-a, rezultat je deljiv linkom i indeksabilan.
 *
 * `id` je prop jer polje postoji dva puta (traka + mobilni meni), a <label for>
 * mora da pokazuje na jedinstven element.
 */
function Pretraga({ id, className }: { id: string; className?: string }) {
  return (
    <form role="search" action="/prodavnica" method="get" className={cn("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Pretraži opremu i delove
      </label>
      {/*
        Lupa je i ikonica i submit dugme — jedan element manje, a korisnik bez
        tastature (i bez JS-a) ima šta da klikne. Enter u polju svakako šalje form.
      */}
      <button
        type="submit"
        aria-label="Pretraži"
        className="absolute left-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-brand/15 hover:text-brand-400"
      >
        <Search aria-hidden className="h-4 w-4" />
      </button>
      <input
        id={id}
        type="search"
        name="q"
        // Primeri umesto „Pretraga…" — kupac vidi ČIME se pretražuje ovaj katalog.
        placeholder="Maska, staklo, baterija…"
        // 120 je gornja granica koju `parseUpit` seče — bolje da polje ne pusti
        // više nego da se upit tiho skrati.
        maxLength={120}
        autoComplete="off"
        className="h-10 w-full rounded-full border border-input bg-ink-800 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-brand/40 focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 [&::-webkit-search-cancel-button]:hidden"
      />
    </form>
  );
}

/* -------------------------------- Stilovi ---------------------------------- */

const NAV_LINK =
  "whitespace-nowrap rounded-full px-3 py-2 font-display text-[0.95rem] font-semibold tracking-[-0.012em] text-cream/85 transition-colors hover:bg-ink-700 hover:text-cream xl:text-[0.98rem]";

/** Čip u traci kategorija — nizak kontrast, da ne otima pažnju od glavnog menija. */
const CIP =
  "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.8rem] text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand-400";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 glass border-b border-border shadow-soft">
      <div className="container flex h-[4.65rem] items-center gap-3 md:h-[5.2rem] md:gap-4">
        {/* Logotip se skalira preko `text-*` — na telefonu je wordmark uži da
            ostane mesta za poziv i meni. */}
        <Link href="/" aria-label={`${site.name} — početna`} className="shrink-0">
          <Logo variant="full" className="text-[0.9rem] md:text-[1.05rem]" />
        </Link>

        {/* `ml-auto` gura sve desno — logotip ostaje sam na levoj strani. */}
        <nav aria-label="Glavna navigacija" className="ml-auto hidden items-center gap-1 xl:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Od xl `ml-auto` pada na `ml-2`: prazan prostor u redu treba da ostane
            IZMEĐU logotipa i menija, a ne da razdvaja meni od pretrage. */}
        <Pretraga
          id="pretraga-zaglavlje"
          className="ml-auto hidden w-40 md:block lg:w-52 xl:ml-2 2xl:w-64"
        />

        {/* Telefon je glavni CTA: vlasnik prima narudžbine pozivom ili porukom,
            pa broj stoji vidljiv na svakoj strani. */}
        <Button asChild size="md" className="hidden shrink-0 font-semibold lg:inline-flex">
          <a href={site.telHref}>
            <Phone aria-hidden className="h-[1.05rem] w-[1.05rem]" />
            {site.phoneDisplay}
          </a>
        </Button>

        {/* Na telefonu i tabletu: samo ikonica poziva — broj ne staje pored menija. */}
        <Button asChild size="sm" className="ml-auto shrink-0 px-3 md:ml-0 lg:hidden">
          <a href={site.telHref} aria-label={`Pozovi ${site.phoneDisplay}`}>
            <Phone aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">Pozovi</span>
          </a>
        </Button>

        {/*
          Mobilni meni. <details> nosi stanje, pa nema ni state-a ni listenera;
          panel je `absolute` u odnosu na fiksirani <header>, tako da zatvoren
          <details> ne zauzima ništa u traci.
        */}
        <details className="group shrink-0 xl:hidden">
          <summary
            aria-label="Meni"
            className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-ink-600 bg-ink-800 text-cream transition-colors hover:border-brand/40 hover:text-brand-400 [&::-webkit-details-marker]:hidden"
          >
            <Menu aria-hidden className="h-5 w-5 group-open:hidden" />
            <X aria-hidden className="hidden h-5 w-5 group-open:block" />
          </summary>

          {/*
            `max-h`/`overflow-y-auto`: uz 4 stranice i 13 kategorija panel na
            malom telefonu prelazi ekran, a fiksirani header ne skroluje sa stranom.
            Animacija se pokrene sama — element ide iz display:none u vidljiv.
          */}
          <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-4.65rem)] animate-fade-up overflow-y-auto border-b border-t border-ink-600 bg-ink/95 pb-[env(safe-area-inset-bottom)] shadow-card backdrop-blur-md md:max-h-[calc(100dvh-5.2rem)]">
            <div className="container space-y-6 py-5">
              <Pretraga id="pretraga-meni" className="md:hidden" />

              <nav aria-label="Meni" className="flex flex-col gap-1">
                {nav.map((item) => (
                  /*
                    Obični <a>, ne <Link>: <details> bez JS-a ne ume da se
                    zatvori posle klijentske navigacije, pa bi se nova strana
                    iscrtala ispod otvorenog menija. Pun refresh je cena za
                    meni koji ne košta ni jedan kilobajt JS-a.
                  */
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3 font-display text-base font-semibold text-cream transition-colors hover:bg-ink-700"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div>
                <p className="eyebrow px-4">Asortiman</p>
                <ul className="mt-3 grid grid-cols-2 gap-1">
                  {categories.map(({ key, short, icon: Ikonica }) => (
                    <li key={key}>
                      <a
                        href={kategorijaHref(key)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-cream/80 transition-colors hover:bg-ink-700 hover:text-cream"
                      >
                        <Ikonica aria-hidden className="h-4 w-4 shrink-0 text-brand-400" />
                        <span className="truncate">{short}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Drugi broj ide samo ovde i u futer — u traci bi se takmičio
                  sa glavnim CTA-om. */}
              <div className="border-t border-ink-600 pt-4 text-sm">
                <a
                  href={site.telAltHref}
                  className="flex items-center gap-2.5 px-4 py-2 text-cream/80 transition-colors hover:text-brand-400"
                >
                  <Phone aria-hidden className="h-4 w-4 shrink-0 text-brand-400" />
                  {site.phoneAltDisplay}
                </a>
                <p className="px-4 pt-1 text-muted-foreground">{site.address.full}</p>
              </div>
            </div>
          </div>
        </details>
      </div>

      {/*
        Druga traka: kategorije kao brzi ulaz u prodavnicu. Bez mega-menija —
        13 kratkih naziva staje u jedan red na širini kontejnera, a `overflow-x`
        je sigurnosni ventil za uže xl ekrane i uvećan font sistema.
        Vidljivo od xl: niže bi se sudarilo sa pretragom i CTA-om, a mobilni
        korisnik iste linkove dobija u meniju.
      */}
      <div className="hidden border-t border-ink-600/70 xl:block">
        <nav aria-label="Kategorije" className="container flex h-10 items-center gap-1">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
            <Link
              href="/prodavnica"
              className={cn(CIP, "bg-ink-700 font-semibold text-cream hover:text-cream")}
            >
              Sva oprema
            </Link>
            {categories.map((c) => (
              <Link key={c.key} href={kategorijaHref(c.key)} className={CIP}>
                {c.short}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
