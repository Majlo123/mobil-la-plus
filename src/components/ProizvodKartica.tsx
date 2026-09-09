import Link from "next/link";
import { Cena } from "@/components/Cena";
import { KontaktDugmad } from "@/components/KontaktDugmad";
import { ProductThumb } from "@/components/ProductThumb";
import { productPath } from "@/lib/catalog";
import { formatRsd, imaCenu } from "@/lib/pricing";
import { cn } from "@/lib/utils";
// `import type` — tip, ne podaci: `products.ts` uvlači ceo katalog (~1,5 MB) i
// sme samo na serveru, a tip se briše pri kompajliranju.
import type { Product } from "@/lib/products";

/**
 * Kartica artikla u mreži (prodavnica, kategorije, „srodni proizvodi").
 *
 * Naručivanja nema — kupac vidi cenu i odmah pod njom kanale preko kojih se
 * javlja (Viber / WhatsApp / Instagram / telefon), sa predpopunjenom porukom
 * za taj konkretan artikal. Zato kartica NIJE jedan veliki <a>: unutar nje
 * postoje drugi linkovi, a ugnježden klik-element je i nevalidan HTML i
 * pokvari klik na dugmad.
 */

const THUMB_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw";

export function ProizvodKartica({
  item,
  className,
}: {
  item: Product;
  className?: string;
}) {
  const href = productPath(item);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift",
        className,
      )}
    >
      {/*
        Slika vodi na isti proizvod kao i naslov. `tabIndex={-1}` + `aria-hidden`
        da tastatura i čitač ekrana ne prolaze kroz isti link dva puta —
        klik mišem po slici i dalje radi.
      */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/3] overflow-hidden bg-ink-700"
      >
        <ProductThumb
          artikal={item}
          sizes={THUMB_SIZES}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.7rem] font-medium text-cream ring-1 ring-cream/10 backdrop-blur-sm">
          {item.typeLabel}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold leading-snug text-cream">
          <Link
            href={href}
            className="line-clamp-2 rounded-sm transition-colors hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800"
          >
            {item.name}
          </Link>
        </h3>

        {item.modelLabel ? (
          <p className="mt-1 truncate text-[0.76rem] text-muted-foreground">{item.modelLabel}</p>
        ) : null}

        {/* Cena i kontakt uvek na dnu kartice, pa su u mreži poravnati. */}
        <div className="flex-1" />

        <div className="mt-3">
          <Cena rsd={item.price} />
        </div>

        <div className="mt-3 border-t border-ink-600 pt-3">
          <KontaktDugmad
            naziv={item.name}
            // Cena ide u poruku samo ako postoji — inače bi upit glasio
            // „zanima me: … (Cena na upit)".
            cena={imaCenu(item.price) ? formatRsd(item.price) : undefined}
            layout="kompakt"
          />
        </div>
      </div>
    </article>
  );
}
