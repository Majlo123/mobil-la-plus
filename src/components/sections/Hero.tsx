import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Wrench } from "lucide-react";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { Button } from "@/components/ui/button";
import { site } from "@/lib/site";

/**
 * Prvi ekran početne strane.
 *
 * Namerno bez fotografije radnje: hero se najčešće otvara sa mobilnog, a slika
 * od pola megabajta bi kasnila baš tamo gde stoji glavna poruka. Dubinu nose
 * slojevi iz brend palete (plavi odsjaj + „štampana ploča" sa logotipa), koji
 * ne koštaju ni jedan dodatni zahtev — jedina slika je sam logotip.
 *
 * Gornji padding je veliki jer je header fiksiran preko sadržaja.
 */

/** Dan bez sati („Zatvoreno") se u ovoj sitnoj liniji izostavlja. */
const radnoVreme = site.hours.filter((h) => h.time.includes(":"));

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pb-16 pt-28 md:pb-24 md:pt-36">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-circuit-glow"
      />
      {/* Trake „štampane ploče" sa logotipa — maska u klasi ih gasi ka dnu. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 circuit-lines"
      />

      <div className="container grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        {/* Poruka je prva i u DOM-u i na ekranu — logotip je prati, ne obrnuto. */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-800/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-400">
            <MapPin aria-hidden className="h-3.5 w-3.5" />
            {site.address.street} · {site.address.city}
          </span>

          <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-[1.06] tracking-[-0.02em] text-balance text-cream md:text-5xl lg:text-[3.5rem]">
            Kompletan <span className="text-brand-500">servis</span> mobilnih
            telefona u Novom Sadu
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-cream/70">
            Zamena ekrana i baterije, skidanje Google naloga (FRP) i spašavanje
            podataka sa uređaja koji više ne pale. Uz servis — maske, zaštitna
            stakla, punjači i kablovi, sa cenom koja stoji na sajtu.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/prodavnica">
                Pogledaj prodavnicu
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/servis">
                <Wrench aria-hidden className="h-4 w-4" />
                Servis telefona
              </Link>
            </Button>
          </div>

          {/*
            Kanali stoje odmah pod CTA-om jer je poruka jedini način da se
            artikal rezerviše ili kvar opiše — korpe na sajtu nema.
          */}
          <div className="mt-8 border-t border-ink-600 pt-6">
            <p className="text-sm font-medium text-cream/60">
              Pišite ili pozovite — odgovaramo isti dan.
            </p>
            <KontaktDugmad layout="red" className="mt-3.5" />
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin aria-hidden className="h-3.5 w-3.5 text-brand-400" />
              {site.address.full}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden className="h-3.5 w-3.5 text-brand-400" />
              {radnoVreme.map((h) => `${h.day} ${h.time}`).join(" · ")}
            </span>
          </div>
        </div>

        {/* Logotip */}
        <div className="relative mx-auto w-full max-w-[320px] lg:max-w-[420px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[10%] rounded-full bg-brand/25 blur-3xl"
          />
          {/*
            logo.jpg je kvadrat sa amblemom u krugu na crnoj podlozi; `rounded-full`
            odseca crne uglove, pa znak stoji sam, bez vidljivog okvira.
          */}
          <Image
            src="/images/brend/logo.jpg"
            alt={`${site.name} — ${site.slogan}`}
            width={1100}
            height={1100}
            priority
            sizes="(max-width: 1024px) 320px, 420px"
            className="relative aspect-square w-full rounded-full object-cover shadow-glow ring-1 ring-brand/20"
          />
        </div>
      </div>
    </section>
  );
}
