import * as React from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Vizual sa brendiranim fallback-om.
 *  - Ako je prosleđen `src` → prikazuje pravu sliku (next/image) preko podloge.
 *  - Ako nema `src` → ostaje podloga: gradijent + mreža + plavi odsjaj +
 *    ikonica, da prazno mesto nikad ne izgleda kao greška.
 *
 * Podloga se crta i kad slika POSTOJI — dok se slika učitava (ili ako pukne
 * putanja) ispod nje je tamna površina, a ne belina koja seče dark temu.
 *
 * ZAMENA SLIKE: slike su u /public/images. Promeni `src` ili zameni fajl
 * istog imena.
 */

/**
 * Tonovi su izvedeni iz brend palete (ink/brand/accent) — nema „tematskih"
 * tonova, jer se svi vizuali na sajtu vrte oko istog: crna podloga + plavo.
 */
export type PlaceholderTone = "ink" | "brand" | "accent";

const tones: Record<PlaceholderTone, string> = {
  ink: "from-ink-600 via-ink-800 to-ink",
  brand: "from-brand-600 via-ink-800 to-ink",
  accent: "from-accent-600/50 via-ink-800 to-ink",
};

type Props = {
  tone?: PlaceholderTone;
  icon?: LucideIcon;
  label?: string;
  className?: string;
  src?: string;
  alt?: string;
  priority?: boolean;
  sizes?: string;
  showHint?: boolean; // diskretna "ZAMENI fotografiju" oznaka (samo bez src)
  children?: React.ReactNode;
};

export function MediaPlaceholder({
  tone = "ink",
  icon: Icon = Smartphone,
  label,
  className,
  src,
  alt,
  priority = false,
  sizes = "100vw",
  showHint = false,
  children,
}: Props) {
  return (
    <div
      className={cn(
        "relative isolate flex items-center justify-center overflow-hidden bg-gradient-to-br",
        tones[tone],
        className,
      )}
    >
      {/* Mreža — odjek štampane ploče sa logotipa; drži i praznu površinu „živom". */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:28px_28px]" />
      {/* Plavi odsjaj odozgo — isti sloj kao u hero-u, da se vizuali poklope. */}
      <div className="pointer-events-none absolute inset-0 bg-circuit-glow" />

      {src ? (
        <Image
          src={src}
          alt={alt ?? label ?? ""}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <>
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-ink-600 bg-ink-800/70 text-brand-400 shadow-glow backdrop-blur-sm">
              <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden />
            </span>
            {label ? (
              <span className="max-w-[16rem] text-sm font-medium text-cream/70">
                {label}
              </span>
            ) : null}
          </div>
          {showHint ? (
            <span className="absolute bottom-3 right-3 z-20 rounded-full border border-ink-600 bg-ink/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-cream/60 backdrop-blur-sm">
              ZAMENI fotografiju
            </span>
          ) : null}
        </>
      )}

      {children}
    </div>
  );
}
