import { deloviSlika, sitemapIndeks, xmlOdgovor } from "@/lib/sitemap";

/**
 * `/image-sitemap.xml` — indeks image sitemap-a, poseban od `/sitemap.xml` zato
 * što ugrađeni Next sitemap ne ume da upiše `<image:image>` unose, a indeks ne
 * sme da pokazuje na drugi indeks. Oba su prijavljena u `robots.ts`.
 *
 * ŠTA SE PROMENILO: ovaj fajl je do sada objašnjavao zašto fotografija artikala
 * OVDE NEMA — slike su stajale kao pune adrese na veleprodajnim sajtovima
 * (`gsmexpert.rs`, `www.vipmobil.net`, Azure blob GSM 3G-a), a Google sliku
 * pripisuje domenu koji je servira i prijavljene slike sa tuđeg hosta ignoriše
 * dok se ne uradi cross-domain potvrda u Search Console-u — na domenu koji nije
 * naš. Sada postoji ruta `/slika/[slug]` (vidi `src/app/slika/[slug]/route.ts`),
 * koja fotografiju preuzme od dobavljača i servira sa NAŠEG domena, pa slika sme
 * i u `<img src>` i u ovaj sitemap. Zato ih ovde ima 33.502.
 *
 * ŠTA JE I DALJE OGRANIČENJE: fotografije su i dalje dobavljačeve. Kao njihov
 * preprodavac smemo da ih prikazujemo za artikle koje prodajemo, a ovim ih i
 * serviramo sa svog domena i prijavljujemo Google-u. Ako neki dobavljač to
 * ospori, gasi se u dva poteza: `ProductThumb` se vrati sa `nasaSlika(...)` na
 * `slikaZa(...)`, a delovi ovog sitemap-a prestanu da ih nabrajaju. Placeholder
 * slike („nema fotografije" kod vipmobil-a) se ni sada ne prijavljuju — vidi
 * `fotografijeZaIndeks()`.
 *
 * 33.502 fotografije ne staju u jedan fajl po Google-ovoj preporuci, pa je ovo
 * indeks, a sami unosi su u delovima `/image-sitemap/1.xml`, `/image-sitemap/2.xml`…
 */
export function GET() {
  return xmlOdgovor(sitemapIndeks(deloviSlika().map((deo) => `/image-sitemap/${deo}.xml`)));
}
