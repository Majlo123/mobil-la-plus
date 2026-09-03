import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { categories } from "@/lib/data";
import { cn } from "@/lib/utils";

/**
 * Vizual artikla u prodavnici.
 *  - Ako postoji fotografija → prikazuje se na svetloj ploči (fotografije iz
 *    veleprodajnih kataloga su na beloj podlozi, pa bi na crnoj kartici bile
 *    bele „krpe”; svetla ploča ih pretvara u namerno rešenje).
 *  - Ako fotografije nema (`image` je opciono u katalogu) → brendiran tamni
 *    tile sa ikonicom vrste artikla i kataloškim kodom, da nijedan artikal ne
 *    izgleda kao greška na strani.
 *
 * Ovo je server komponenta — nema fallback-a „na grešku slike”. Ako putanja
 * pukne, ispod slike ostaje svetla ploča, ne prazna belina.
 *
 * Slike idu `unoptimized`: to su udaljene sličice (~120px) sa sajtova
 * dobavljača, pa bi ih optimizer samo preuveličao — a za 10.000+ artikala bi
 * i tražio da svaki domen stoji u `remotePatterns` i trošio kvotu
 * transformacija hostinga.
 */

/**
 * Vrsta artikla iz kataloga → kategorija, koja nosi i ikonicu i kratku oznaku.
 * `find` nad 13 kategorija je jeftiniji od indeksa koji bi morao da se drži u
 * sinhronizaciji sa `categories` (isto radi i `categoryLabel` u lib/data).
 */
const vrstaArtikla = (typeKey?: string) =>
  typeKey ? categories.find((c) => c.key === typeKey) : undefined;

type ThumbProps = {
  src?: string;
  name: string;
  /** Ključ vrste artikla iz kataloga — određuje ikonicu na placeholder-u. */
  typeKey?: string;
  /** Kataloški kod artikla; prikazuje se sitno, kad slike nema. */
  code?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ProductThumb({
  src,
  name,
  typeKey,
  code,
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority = false,
  className,
}: ThumbProps) {
  /* --- Fotografija artikla --- */
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-cream p-3", className)}>
        <Image
          src={src}
          alt={name}
          fill
          sizes={sizes}
          priority={priority}
          // vidi napomenu na vrhu fajla
          unoptimized
          // `contain`, ne `cover`: sličice dobavljača već imaju svoju marginu,
          // pa bi `cover` odsekao ivice proizvoda.
          className="object-contain"
        />
      </div>
    );
  }

  /* --- Nema fotografije → brendiran placeholder --- */
  const vrsta = vrstaArtikla(typeKey);
  const Icon = vrsta?.icon ?? ImageIcon;
  const oznaka = vrsta?.short;

  return (
    <div
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-gradient-to-br from-ink-700 via-ink-800 to-ink",
        className,
      )}
      role="img"
      aria-label={`${name} — fotografija uskoro`}
    >
      {/* Mreža sa logotipa (štampana ploča) — drži tile brendiranim bez slike. */}
      <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:22px_22px]" />

      <div className="relative flex flex-1 flex-col items-center justify-center gap-2.5 px-4 py-5 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-ink-600 bg-ink-800/80 text-brand-400">
          <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
        </span>
        <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Fotografija uskoro
        </span>
      </div>

      {oznaka || code ? (
        <div className="relative z-10 flex items-center justify-between gap-2 border-t border-ink-600 px-3 py-2">
          {oznaka ? (
            <span className="min-w-0 truncate text-[0.66rem] font-medium text-cream/60">
              {oznaka}
            </span>
          ) : (
            <span />
          )}
          {code ? (
            <span className="shrink-0 text-[0.66rem] font-semibold tabular-nums text-muted-foreground">
              {code}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
