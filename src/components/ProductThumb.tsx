import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { categories } from "@/lib/data";
import { altSlike } from "@/lib/opis-slike";
import {
  JE_PRAZNA_SLIKA,
  nasaSlika,
  slikaZa,
  trebaOptimizaciju,
  type Kadar,
} from "@/lib/slike";
import { cn } from "@/lib/utils";
// `import type` — tip, ne podaci: `products.ts` uvlači ceo katalog i sme samo
// na serveru, a tip se briše pri kompajliranju.
import type { Product } from "@/lib/products";

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
 * ADRESA SLIKE je uvek NAŠA (`/slika/<slug>.jpg`), nikad dobavljačeva — vidi
 * `nasaSlika` u `src/lib/slike.ts` i rutu `src/app/slika/[slug]/route.ts`.
 * Ukratko: Google Images sliku pripisuje domenu koji je servira, pa bi sa
 * `<img src="https://www.vipmobil.net/…">` sve naše fotografije u pretrazi
 * slika bile tuđe. Ruta preuzme original sa dobavljača i servira ga sa našeg
 * domena, uz keš od godinu dana.
 *
 * Prima ceo artikal, a ne raspakovana polja, jer mu za sliku treba `slug` (za
 * našu adresu), a za alt tekst i naziv, vrsta, marka i model — vidi
 * `src/lib/opis-slike.ts`. Sedam propova koji uvek dolaze iz istog objekta samo
 * su prilika da se negde prosledi pogrešan par.
 *
 * Koju veličinu ruta traži od dobavljača određuje `kadar`, isto kao i ranije;
 * `trebaOptimizaciju` se i dalje pita nad IZVORNOM adresom, jer odluka zavisi
 * od toga koji dobavljač je u pitanju i koliko je slika velika (vipmobil
 * original na strani artikla je 3264×3264 i ide kroz Next-ov optimizer).
 */

/**
 * Vrsta artikla iz kataloga → kategorija, koja nosi i ikonicu i kratku oznaku.
 * `find` nad 13 kategorija je jeftiniji od indeksa koji bi morao da se drži u
 * sinhronizaciji sa `categories` (isto radi i `categoryLabel` u lib/data).
 */
const vrstaArtikla = (typeKey?: string) =>
  typeKey ? categories.find((c) => c.key === typeKey) : undefined;

type ThumbProps = {
  artikal: Product;
  /** Gde se slika prikazuje — određuje koja se veličina traži od izvora. */
  kadar?: Kadar;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ProductThumb({
  artikal,
  kadar = "kartica",
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority = false,
  className,
}: ThumbProps) {
  const alt = altSlike(artikal);

  // Placeholder dobavljača nije fotografija proizvoda — bolje naš tile.
  // `izvor` je ono što će ruta preuzeti; do pretraživača nikad ne stiže, ali od
  // njega zavisi da li slika ide kroz optimizer.
  const izvor = JE_PRAZNA_SLIKA(artikal.image)
    ? undefined
    : slikaZa(artikal.image, kadar);

  /* --- Fotografija artikla --- */
  if (izvor) {
    return (
      <div className={cn("relative overflow-hidden bg-cream p-3", className)}>
        <Image
          src={nasaSlika(artikal.slug, kadar)}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          // vidi napomenu na vrhu fajla
          unoptimized={!trebaOptimizaciju(izvor, kadar)}
          // `contain`, ne `cover`: sličice dobavljača već imaju svoju marginu,
          // pa bi `cover` odsekao ivice proizvoda.
          className="object-contain"
        />
      </div>
    );
  }

  /* --- Nema fotografije → brendiran placeholder --- */
  const vrsta = vrstaArtikla(artikal.typeKey);
  const Icon = vrsta?.icon ?? ImageIcon;
  const oznaka = vrsta?.short;
  // Kataloški kod se ispisuje samo tamo gde se artikal gleda izbliza (strana
  // artikla): u mreži kartica je to sitan broj koji nikome ništa ne znači.
  const kod = kadar === "detalj" ? artikal.id : undefined;

  return (
    <div
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-gradient-to-br from-ink-700 via-ink-800 to-ink",
        className,
      )}
      role="img"
      aria-label={`${alt} — fotografija uskoro`}
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

      {oznaka || kod ? (
        <div className="relative z-10 flex items-center justify-between gap-2 border-t border-ink-600 px-3 py-2">
          {oznaka ? (
            <span className="min-w-0 truncate text-[0.66rem] font-medium text-cream/60">
              {oznaka}
            </span>
          ) : (
            <span />
          )}
          {kod ? (
            <span className="shrink-0 text-[0.66rem] font-semibold tabular-nums text-muted-foreground">
              {kod}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
