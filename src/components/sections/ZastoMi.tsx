import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { advantages } from "@/lib/data";
import { site } from "@/lib/site";

/**
 * „Zašto kod nas" — četiri poruke sa dna flajera, ne izmišljene prednosti.
 *
 * Tekst stoji u `advantages` (lib/data) da bi bio isti i ovde i na `/o-nama`.
 * Sekcija je na blago izdignutoj podlozi jer je između dve sekcije na osnovnoj
 * crnoj — na dark-first sajtu je promena podloge jedina granica koja se vidi.
 */
export function ZastoMi() {
  return (
    <section className="section relative isolate overflow-hidden border-t border-ink-600 bg-ink-800/40">
      {/* Dva odsjaja u brend/amber boji — dubina bez ijedne dodatne slike. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-0 -z-10 h-80 w-80 rounded-full bg-brand/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-80 w-80 rounded-full bg-accent/[0.07] blur-3xl"
      />

      <div className="container">
        <SectionHeading
          eyebrow={`Zašto ${site.name}`}
          title="Majstor koji objasni kvar, pa onda uzme odvijač"
          description="Bez naduvanih obećanja: kažemo šta je kvar, koliko košta, koliko traje i koji deo ulazi u telefon. Ako nešto ne možemo, kažemo i to."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((a, i) => {
            const Ikonica = a.icon;

            return (
              <Reveal key={a.title} delay={(i % 4) * 0.07}>
                <article className="group flex h-full flex-col rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card transition-colors duration-300 hover:border-brand/40">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand-400 ring-1 ring-brand/25 transition-colors duration-300 group-hover:bg-brand group-hover:text-cream">
                    <Ikonica aria-hidden className="h-6 w-6" strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-5 text-base font-bold leading-snug text-cream">
                    {a.title}
                  </h3>
                  <p className="mt-2.5 text-[0.93rem] leading-relaxed text-cream/70">
                    {a.description}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mt-10">
          <Button asChild variant="outline">
            <Link href="/o-nama">
              O radnji i našem načinu rada
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
