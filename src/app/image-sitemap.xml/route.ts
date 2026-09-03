import { getProductsWithPhotos, productHref, type Product } from "@/lib/products";
import { site, SITE_URL } from "@/lib/site";

/**
 * Image sitemap — poseban XML sa `image:` namespace-om, jer ugrađeni Next 14
 * sitemap ne ume da upiše `<image:image>` unose.
 *
 * ZAŠTO OVDE NEMA FOTOGRAFIJA ARTIKALA:
 * skoro sve slike u katalogu su pune adrese na veleprodajne sajtove
 * (`gsmexpert.rs`, `www.vipmobil.net`, `gsm3g.com`) — katalog ih ne kešira
 * lokalno. Za takve slike image sitemap nema smisla iz dva razloga:
 *
 *   1. Google indeksira sliku pod domenom na kome se nalazi i prijavljene slike
 *      sa tuđeg hosta ignoriše dok se ne uradi cross-domain verifikacija u
 *      Search Console-u — a taj domen nije naš i nikad neće biti.
 *   2. To su tuđe fotografije. Imamo pravo da ih prikažemo kao distributer,
 *      ali ne da ih prijavljujemo kao svoj sadržaj za Google Images.
 *
 * Zato sitemap sadrži SAMO slike sa našeg domena: brend materijal iz
 * `public/images/brend/` i (kad ih bude) lokalno keširane fotografije artikala.
 * Filter po `startsWith("/")` je ostavljen namerno — u trenutku kad `npm run
 * katalog` počne da skida slike u `public/`, one same ulaze u ovaj sitemap, bez
 * ikakve izmene koda.
 */


const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) =>
    c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === "&" ? "&amp;" : c === "'" ? "&apos;" : "&quot;",
  );

/**
 * Naše slike i stranice na kojima stoje. Naslov je alt tekst za Google Images.
 *
 * Ovde je samo logotip. Flajer se NE prikazuje na sajtu (poslat je kao izvor
 * podataka i smera dizajna, ne kao slika za objavu), pa nema ni šta da se
 * prijavi Google-u — sadržaj sa njega stoji kao tekst na `/servis`.
 */
const BREND_SLIKE: { href: string; image: string; title: string }[] = [
  {
    href: "/",
    image: "/images/brend/logo.jpg",
    title: `${site.name} — servis i oprema za mobilne telefone, ${site.city}`,
  },
];

const unos = (href: string, image: string, title: string) =>
  `  <url>\n    <loc>${escapeXml(`${SITE_URL}${href}`)}</loc>\n    <image:image>\n      <image:loc>${escapeXml(
    `${SITE_URL}${image}`,
  )}</image:loc>\n      <image:title>${escapeXml(title)}</image:title>\n    </image:image>\n  </url>`;

export function GET() {
  // Samo lokalne putanje („/images/…"); udaljene adrese dobavljača preskačemo.
  const lokalneFotografije = getProductsWithPhotos()
    .filter((p): p is Product & { image: string } => !!p.image && p.image.startsWith("/"))
    .map((p) => unos(productHref(p), p.image, p.name));

  const urls = [
    ...BREND_SLIKE.map((s) => unos(s.href, s.image, s.title)),
    ...lokalneFotografije,
  ].join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
