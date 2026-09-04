import { productHref, type Product } from "@/lib/products";
import { SITE_URL } from "@/lib/site";

/**
 * ItemList strukturirani podaci za strane koje su spisak artikala — kategorije
 * (`/kategorija/[tip]`) i strane brenda (`/za-telefon/[brend]`).
 *
 * Bez ovoga Google vidi mrežu kartica kao običan tekst i sam pogađa šta je na
 * strani spisak a šta okolina (kontakt blok, srodne kategorije, futer). Sa
 * ItemList-om zna tačan redosled i koliko artikala strana nosi, pa je veća
 * šansa da se u rezultatu pojavi kao lista, a ne kao jedan goli link.
 *
 * Namerno „sažeti" oblik iz Google-ove specifikacije: svaki unos je samo
 * pozicija + adresa + naziv, a puni podaci (cena, slika, dostupnost) stoje na
 * strani artikla kao `Product`. Drugi oblik — ceo `Product` u svakom unosu —
 * ovde bi značio 48 ugnježdenih ponuda u HTML-u kategorije, uz obavezu da se
 * svaka cena poklopi sa onom na strani artikla.
 *
 * `ukupno` je broj SVIH artikala te vrste/brenda, ne samo prikazanih: strana
 * pokazuje vitrinu, a Google-u je korisno da zna koliko ih zaista ima.
 */
export function SpisakJsonLd({
  naziv,
  stavke,
  ukupno,
}: {
  naziv: string;
  stavke: Product[];
  /** Ukupan broj artikala u kategoriji/brendu; podrazumevano — koliko je prikazano. */
  ukupno?: number;
}) {
  if (stavke.length === 0) return null;

  const json = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: naziv,
    numberOfItems: ukupno ?? stavke.length,
    itemListElement: stavke.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${SITE_URL}${productHref(p)}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
