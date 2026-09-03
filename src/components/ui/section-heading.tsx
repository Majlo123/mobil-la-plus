import { cn } from "@/lib/utils";
import { Reveal } from "@/components/Reveal";

type Props = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  /**
   * Ton TEKSTA, ne pozadine. Sajt je dark-first, pa je „light" (cream tekst)
   * podrazumevan; „dark" ostaje za retke svetle sekcije (npr. blok sa flajerom
   * na cream podlozi).
   */
  variant?: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  variant = "light",
  className,
}: Props) {
  const naTamnom = variant === "light";

  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <span
          className={cn(
            "eyebrow",
            // brand-600 iz `.eyebrow` na crnoj podlozi pada ispod granice
            // čitljivosti — na tamnom ide svetlija varijanta brenda.
            naTamnom ? "text-brand-400" : "text-brand-600",
          )}
        >
          <span className="h-px w-6 bg-current" />
          {eyebrow}
        </span>
      ) : null}
      <h2
        className={cn(
          "mt-4 text-3xl font-bold leading-[1.08] tracking-[-0.02em] text-balance sm:text-4xl md:text-[2.75rem]",
          naTamnom ? "text-cream" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            naTamnom ? "text-cream/70" : "text-ink-700",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
