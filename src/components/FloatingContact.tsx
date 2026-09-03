"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Phone, X } from "lucide-react";
import { kanaliKontakta } from "@/components/KontaktDugmad";
import { cn } from "@/lib/utils";

/**
 * Lebdeće dugme za brz kontakt — sklopljeno je samo jedan krug u uglu, a
 * otvoreno pokaže iste kanale kao <KontaktDugmad> (Viber, WhatsApp, Instagram,
 * telefon). Kanali se uvoze, ne prepisuju: boje i linkovi žive na jednom mestu.
 *
 * Nema konteksta proizvoda pa poruka ide podrazumevana (site.defaultInquiry) —
 * upit za konkretan artikal nosi kartica/stranica proizvoda.
 */
export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const smanjenaAnimacija = useReducedMotion();

  const kanali = kanaliKontakta();

  // Escape zatvara panel: otvoren zauzima pola ekrana na telefonu.
  useEffect(() => {
    if (!open) return;
    const naTipku = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", naTipku);
    return () => window.removeEventListener("keydown", naTipku);
  }, [open]);

  const pomeraj = smanjenaAnimacija ? 0 : 8;

  return (
    <>
      {/* Zatvaranje klikom van panela — i zatamnjenje da kanali odskoče. */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Zatvori brzi kontakt"
            onClick={() => setOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 cursor-default bg-ink/60 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/*
        z-40 je namerno ISPOD header-a (z-50): kad se otvori mobilni meni, on
        prekriva dugme, a ne obrnuto. Safe-area offset drži dugme iznad
        Home indikatora na iPhone-u, gde bi inače sedelo na paginaciji.
      */}
      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {open && (
            <motion.div
              id="brzi-kontakt"
              initial={{ opacity: 0, y: pomeraj }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: pomeraj }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-end gap-2.5"
            >
              {kanali.map(
                ({ key, label, aria, href, Ikonica, boja, eksterno }, i) => (
                  <motion.a
                    key={key}
                    href={href}
                    aria-label={aria}
                    {...(eksterno
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    onClick={() => setOpen(false)}
                    initial={{ opacity: 0, x: pomeraj }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.22,
                      // Kanali ulaze u nizu — oko sledi listu od vrha ka dugmetu.
                      delay: smanjenaAnimacija ? 0 : i * 0.04,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-full py-2.5 pl-3 pr-4 text-sm font-semibold text-cream shadow-lift transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      boja,
                    )}
                  >
                    <Ikonica aria-hidden className="h-5 w-5" />
                    {label}
                  </motion.a>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Zatvori brzi kontakt" : "Brzi kontakt"}
          aria-expanded={open}
          aria-controls="brzi-kontakt"
          className={cn(
            "relative grid h-12 w-12 place-items-center rounded-full text-cream shadow-lift transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-14 sm:w-14",
            open ? "rotate-90 bg-ink-700" : "bg-brand",
          )}
        >
          {/* Prsten pulsira samo dok je dugme sklopljeno; ide PRE ikonice da je ne prekrije. */}
          {!open && (
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-brand/40 [animation-duration:2.5s] motion-reduce:animate-none"
            />
          )}
          {open ? (
            <X className="h-6 w-6" />
          ) : (
            <Phone className="relative h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </button>
      </div>
    </>
  );
}
