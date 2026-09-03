import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "muted" | "outline";
};

const styles: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-brand text-cream",
  /* Amber je presvetao za cream tekst — na njemu ide crna (ink). */
  accent: "bg-accent text-ink",
  /* Neutralna oznaka: ink-700 je vidljiv i na pozadini strane i na kartici
     (ink-800), pa ista značka radi u oba konteksta. */
  muted: "bg-ink-700 text-muted-foreground",
  outline: "border border-brand/40 text-brand-400",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
