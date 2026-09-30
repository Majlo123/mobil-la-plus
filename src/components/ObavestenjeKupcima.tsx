"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/**
 * Obaveštenje koje iskoči pri ulasku na sajt — uslovi preuzimanja i slanja.
 *
 * Pokazuje se jednom po sesiji (sessionStorage), ne na svakoj strani: kupac iz
 * Google-a često uđe na tri-četiri artikla zaredom, a isti prozor pred svakim
 * bi bio smetnja, ne obaveštenje. Kad se tekst promeni, podigni verziju u
 * ključu — onda ga vide i oni koji su stari već zatvorili.
 *
 * Renderuje se tek posle mount-a, pa ga nema u HTML-u sa servera: ne menja
 * sadržaj strane za pretraživače i ne može da izazove hydration mismatch.
 */
const KLJUC = "obavestenje-kupcima-v1";

export function ObavestenjeKupcima() {
  const [open, setOpen] = useState(false);
  const zatvori = useRef<HTMLButtonElement>(null);
  const smanjenaAnimacija = useReducedMotion();

  useEffect(() => {
    // Storage ume da baci izuzetak (privatni prozor, blokirani kolačići) —
    // tada se obaveštenje prosto prikaže, kao prvi put.
    try {
      if (sessionStorage.getItem(KLJUC)) return;
    } catch {}
    setOpen(true);
  }, []);

  const sakrij = useCallback(() => {
    setOpen(false);
    try {
      sessionStorage.setItem(KLJUC, "1");
    } catch {}
  }, []);

  // Dok je otvoreno: Escape zatvara, strana ispod ne skroluje, fokus na „×".
  useEffect(() => {
    if (!open) return;
    const naTipku = (e: KeyboardEvent) => {
      if (e.key === "Escape") sakrij();
    };
    window.addEventListener("keydown", naTipku);
    const prethodni = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    zatvori.current?.focus();
    return () => {
      window.removeEventListener("keydown", naTipku);
      document.body.style.overflow = prethodni;
    };
  }, [open, sakrij]);

  return (
    <AnimatePresence>
      {open && (
        // z-[60]: iznad header-a (z-50) i lebdećeg kontakt dugmeta (z-40).
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] grid place-items-center p-4"
        >
          {/* Klik van prozora zatvara, kao i „×". */}
          <button
            type="button"
            aria-label="Zatvori obaveštenje"
            tabIndex={-1}
            onClick={sakrij}
            className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="obavestenje-naslov"
            initial={{ opacity: 0, y: smanjenaAnimacija ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: smanjenaAnimacija ? 0 : 12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl bg-cream px-6 pb-10 pt-12 text-center text-ink shadow-lift sm:px-10"
          >
            <button
              ref={zatvori}
              type="button"
              onClick={sakrij}
              aria-label="Zatvori obaveštenje"
              className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="h-5 w-5" strokeWidth={2.5} />
            </button>

            <p
              id="obavestenje-naslov"
              className="font-display text-lg font-bold uppercase tracking-wide"
            >
              Poštovani kupci
            </p>
            <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-brand" />
            <p className="mt-4 font-display text-base font-semibold uppercase leading-relaxed tracking-wide text-ink/85 sm:text-lg">
              Uplata pre slanja.
              <br />
              Lično preuzimanje istog ili sledećeg radnog dana.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
