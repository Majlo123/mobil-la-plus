"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kategorijaHref } from "@/lib/catalog";
import { categories } from "@/lib/data";
import { cn } from "@/lib/utils";

/** Čip u traci kategorija — nizak kontrast, da ne otima pažnju od glavnog menija. */
const CIP =
  "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[0.8rem] text-muted-foreground transition-colors hover:bg-brand/10 hover:text-brand-400";
const CIP_AKTIVAN = "bg-ink-700 font-semibold text-cream hover:text-cream";

/**
 * Druga traka headera: kategorije kao brzi ulaz u prodavnicu, sa istaknutim
 * čipom za stranu na kojoj je kupac. Jedini klijentski deo headera — `usePathname`
 * traži hidrataciju, pa je izdvojen iz `Header` (server komponenta) da ostatak
 * (logo, glavni meni, pretraga, mobilni meni) ostane bez ijednog bajta JS-a.
 *
 * Bez mega-menija — 13 kratkih naziva staje u jedan red na širini kontejnera,
 * a `overflow-x` je sigurnosni ventil za uže xl ekrane i uvećan font sistema.
 */
export function KategorijeTraka() {
  const pathname = usePathname();

  return (
    <nav aria-label="Kategorije" className="container flex h-10 items-center gap-1">
      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
        <Link
          href="/prodavnica"
          className={cn(CIP, pathname === "/prodavnica" && CIP_AKTIVAN)}
        >
          Sva oprema
        </Link>
        {categories.map((c) => {
          const href = kategorijaHref(c.key);
          return (
            <Link key={c.key} href={href} className={cn(CIP, pathname === href && CIP_AKTIVAN)}>
              {c.short}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
