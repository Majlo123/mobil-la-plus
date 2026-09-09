import { deloviStrana, sitemapIndeks, xmlOdgovor } from "@/lib/sitemap";

/**
 * `/sitemap.xml` — indeks, jedina adresa koja se prijavljuje u Search Console-u.
 *
 * Sam spisak URL-ova je u delovima (`/sitemap/strane.xml`,
 * `/sitemap/artikli-1.xml`…) jer sajt ima 39.433 strane, a jedan sitemap fajl
 * sme do 50.000 — vidi `src/lib/sitemap.ts` za razloge podele i za to zašto
 * ovo nije Next-ov `generateSitemaps()`.
 *
 * Ovo je običan route handler (a ne `sitemap.ts` iz Next metapodataka) zato što
 * ugrađeni tip ne ume `<sitemapindex>`. Zbog toga `src/app/sitemap.ts` više ne
 * postoji — dva fajla bi se otimala o istu adresu.
 *
 * Fotografije NISU ovde: za njih postoji `/image-sitemap.xml`, jer indeks ne sme
 * da pokazuje na drugi indeks. Oba stabla su prijavljena u `robots.ts`.
 */
export function GET() {
  return xmlOdgovor(sitemapIndeks(deloviStrana().map((deo) => `/sitemap/${deo}.xml`)));
}
