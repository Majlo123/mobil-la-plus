import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Polja za unos na tamnoj podlozi. Površina je ink-800 (kao kartica) da se
 * polje razlikuje od pozadine strane i bez debele ivice.
 */
const base =
  "flex w-full rounded-xl border border-input bg-ink-800 px-4 py-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground hover:border-brand/40 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input ref={ref} type={type} className={cn(base, "h-12", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-28 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    /* `color-scheme: dark` je jedini način da i NATIVNA padajuća lista
       (koju crta operativni sistem) bude tamna — Tailwind klase ne stižu do
       <option> elemenata na Windows-u. */
    className={cn(base, "h-12 appearance-none pr-10 [color-scheme:dark]", className)}
    {...props}
  />
));
Select.displayName = "Select";
