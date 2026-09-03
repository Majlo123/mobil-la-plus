import { formatRsd, imaCenu } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/**
 * Cena artikla — jedini način na koji se cena prikazuje na sajtu.
 *
 * Samo dinari: vlasnik je odlučio da nema drugog kursa na sajtu, pa nema ni
 * mesta gde bi se kurs mogao raziđi sa cenovnikom u radnji.
 *
 * Artikal bez cene ne sme da izgleda kao artikal sa cenom — „Cena na upit"
 * ide u `muted` i bez display fonta, da kupac na prvi pogled vidi razliku
 * između broja i poziva da se javi.
 */

type CenaProps = {
  /** Maloprodajna cena u dinarima; `null` → „Cena na upit". */
  rsd: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const BROJ: Record<NonNullable<CenaProps["size"]>, string> = {
  sm: "text-[1.05rem]",
  md: "text-xl",
  lg: "text-3xl md:text-[2.1rem]",
};

const VALUTA: Record<NonNullable<CenaProps["size"]>, string> = {
  sm: "text-[0.7rem]",
  md: "text-xs",
  lg: "text-sm",
};

const UPIT: Record<NonNullable<CenaProps["size"]>, string> = {
  sm: "text-[0.82rem]",
  md: "text-[0.95rem]",
  lg: "text-lg",
};

/** Sufiks koji `formatRsd` dodaje — odvaja se samo radi tišeg prikaza valute. */
const SUFIKS = " RSD";

export function Cena({ rsd, size = "md", className }: CenaProps) {
  if (!imaCenu(rsd)) {
    return (
      <span
        className={cn(
          "inline-block font-medium leading-none text-muted-foreground",
          UPIT[size],
          className,
        )}
      >
        {formatRsd(rsd)}
      </span>
    );
  }

  // Formatiranje ostaje u `formatRsd` (jedan izvor istine); ovde se samo
  // odseca „RSD" da bi valuta mogla biti sitnija od broja.
  const tekst = formatRsd(rsd);
  const broj = tekst.endsWith(SUFIKS) ? tekst.slice(0, -SUFIKS.length) : tekst;

  return (
    <span className={cn("inline-flex items-baseline gap-1.5 leading-none", className)}>
      {/* tabular-nums: u mreži proizvoda cene ostaju poravnate po ciframa */}
      <span className={cn("font-display font-bold tabular-nums text-cream", BROJ[size])}>
        {broj}
      </span>
      <span
        className={cn(
          "font-semibold uppercase tracking-[0.08em] text-brand-400",
          VALUTA[size],
        )}
      >
        RSD
      </span>
    </span>
  );
}
