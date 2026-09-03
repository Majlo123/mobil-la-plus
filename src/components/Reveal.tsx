"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Suptilni „reveal-on-scroll” wrapper. Animira sadržaj pri ulasku u vidno polje.
 *
 * Na crnoj podlozi je pokret jedini nagoveštaj da je sadržaj nov, pa je fade
 * plus mali pomak nagore — bez skaliranja, koje na tamnom izgleda kao treperenje.
 */

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
};

/** Vrednosti dolaze kroz `custom` da bi `y` iz propsa stigao i do `hidden`. */
type Custom = { delay: number; y: number; duration: number };

const variants: Variants = {
  hidden: (c: Custom) => ({ opacity: 0, y: c.y }),
  visible: (c: Custom) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: c.duration,
      delay: c.delay,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export function Reveal({ children, delay = 0, y = 24, className }: Props) {
  /**
   * Framer sam po sebi ne gleda prefers-reduced-motion, a pravilo iz
   * globals.css ne dohvata inline stilove koje Framer upisuje — zato hook.
   */
  const smanjenPokret = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={variants}
      /**
       * `hidden` ostaje identičan i kad je pokret smanjen: kad bi se početni
       * inline stil razlikovao od serverskog, React bi prijavio hydration
       * neslaganje. Gasi se samo trajanje, pa je prelaz trenutan.
       */
      custom={
        {
          delay: smanjenPokret ? 0 : delay,
          y,
          duration: smanjenPokret ? 0 : 0.6,
        } satisfies Custom
      }
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}
