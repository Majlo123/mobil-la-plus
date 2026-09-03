import { cn } from "@/lib/utils";

/**
 * Zaglavlje unutrašnjih stranica — kompaktan „hero” na crnoj podlozi.
 *
 * Nema fotografije u pozadini: strane prodavnice i servisa se otvaraju često i
 * sa mobilnog, a hero slika od pola megabajta bi kasnila baš tamo gde korisnik
 * čita naslov. Dubinu nose slojevi iz brend palete (plavi odsjaj + mreža sa
 * logotipa), koji ne koštaju ni jedan zahtev.
 *
 * Gornji padding je veliki jer je header fiksiran preko sadržaja.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative isolate overflow-hidden border-b border-ink-600 pt-28 pb-14 md:pt-36 md:pb-20",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-circuit-glow" />
      {/* Mreža bledi ka dnu da naslov ne stoji na „milimetarskom papiru”. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-grid-faint [background-size:32px_32px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="container animate-fade-up">
        {eyebrow ? (
          <span className="eyebrow text-brand-400">
            <span className="h-px w-6 bg-current" />
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.02em] text-balance text-cream md:text-5xl lg:text-[3.4rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-cream/70">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
