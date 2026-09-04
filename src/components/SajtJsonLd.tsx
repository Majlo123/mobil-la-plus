import { ID_FIRME, site, SITE_URL } from "@/lib/site";

/**
 * WebSite strukturirani podaci — za pretragu po imenu radnje („mobil plus la",
 * „mobil plus novi sad"). Pokriva dve stvari koje `MobilePhoneStore` iz
 * `app/layout.tsx` sam ne nosi:
 *
 *  1. `publisher` vezuje domen za firmu preko njenog `@id`, pa Google zna da su
 *     sajt i radnja isti entitet — to je ono što popunjava panel pored rezultata.
 *  2. `SearchAction` prijavljuje pretragu prodavnice, pa uz rezultat može da
 *     stane i polje za pretragu (sitelinks searchbox): čovek koji ukuca ime
 *     radnje odmah traži deo, bez otvaranja sajta.
 *
 * IDE SAMO NA POČETNU. Google izričito traži `WebSite` na početnoj strani i
 * nigde drugde; ponovljen na svakoj strani ume da bude ignorisan u celosti —
 * zato ovo nije u layout-u, iako je firma odande na svakoj strani.
 *
 * `urlTemplate` mora da vodi na stvarnu pretragu: `/prodavnica?q=…` se čita
 * serverski (vidi `parseUpit` u `src/lib/shop-query.ts`), pa rezultat postoji
 * i bez JavaScript-a u pretraživaču.
 */
const json = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#sajt`,
  url: SITE_URL,
  name: site.name,
  // Ljudi kucaju i „mobil plus" i „mobil plus novi sad" — isti spisak kao kod firme.
  alternateName: ["Mobil Plus", "MOBIL PLUS LA", "Mobil Plus Novi Sad"],
  description: site.description,
  inLanguage: "sr-RS",
  publisher: { "@id": ID_FIRME },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/prodavnica?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export function SajtJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
