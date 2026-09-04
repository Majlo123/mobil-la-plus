import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { usluge } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Usluge servisa na početnoj — kratak izlog onoga što piše na flajeru.
 *
 * Tekst i redosled dolaze iz `usluge` (lib/data), da se sekcija i stranica
 * `/servis` nikad ne raziđu. Ovde se prikazuju sve četiri usluge, a detalji
 * (cene, rokovi, načini prijema) ostaju na stranici servisa.
 */

/**
 * Amber je na flajeru rezervisan za „SPAŠAVANJE PODATAKA" — usluga koju ljudi
 * traže u panici i po kojoj se firma razlikuje od komšijskog servisa. Zato je
 * ta jedna kartica u akcentu, a ostale u plavoj: da akcent nešto i znači.
 */
const AKCENAT = "podaci";

export function UslugeServisa() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Servis telefona"
          title="Vršimo kompletan servis mobilnih telefona"
          description="Koristimo alat i opremu napravljenu za mikrolemljenje. Kvar objasnimo i cenu kažemo pre nego što uzmemo alat u ruke."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {usluge.map((u, i) => {
            const Ikonica = u.icon;
            const akcenat = u.key === AKCENAT;

            return (
              <Reveal key={u.key} delay={(i % 2) * 0.08}>
                <article className="flex h-full flex-col rounded-2xl border border-ink-600 bg-ink-800 p-6 shadow-card transition-colors duration-300 hover:border-brand/40 md:p-7">
                  <span
                    className={cn(
                      "grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1",
                      akcenat
                        ? "bg-accent/10 text-accent ring-accent/25"
                        : "bg-brand/10 text-brand-400 ring-brand/25",
                    )}
                  >
                    <Ikonica aria-hidden className="h-6 w-6" strokeWidth={1.75} />
                  </span>

                  <h3 className="mt-5 text-lg font-bold leading-snug text-cream">
                    {u.title}
                  </h3>
                  <p className="mt-2.5 text-[0.95rem] leading-relaxed text-cream/70">
                    {u.description}
                  </p>

                  {u.stavke ? (
                    <ul className="mt-5 space-y-2 border-t border-ink-600 pt-5 text-sm text-cream/75">
                      {u.stavke.map((s) => (
                        <li key={s} className="flex items-start gap-2">
                          <Check
                            aria-hidden
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                          />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1} className="mt-10">
          <Button asChild variant="outline">
            <Link href="/servis">
              Sve o servisu i rokovima
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
