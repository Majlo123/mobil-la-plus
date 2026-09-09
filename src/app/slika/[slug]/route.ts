import { slikaPoSlugu } from "@/lib/products";
import { izvorZaIndeks, JE_PRAZNA_SLIKA, slikaZa } from "@/lib/slike";

/**
 * Fotografija artikla servirana sa NAŠEG domena.
 *
 * ZAŠTO POSTOJI — Google Images. Slika u Google Images pripada domenu koji je
 * servira. Dok je `<img src>` puna adresa na `gsmexpert.rs`, `vipmobil.net` ili
 * Azure blob storage-u GSM 3G-a, sve naše fotografije u Google Images pripadaju
 * njima: mi možemo da imamo savršen alt tekst, naslov i opis, a slika će se
 * pojaviti pod tuđim domenom ili se neće pojaviti uopšte. Isto važi i za image
 * sitemap — prijavljene slike sa tuđeg hosta Google ignoriše dok se ne uradi
 * cross-domain potvrda u Search Console-u, a taj domen nije i neće biti naš.
 *
 * Ova ruta preuzme sliku sa dobavljača i servira je kao `/slika/<slug>.jpg`, pa
 * je od tog trenutka fotografija na našem domenu i sme u image sitemap.
 *
 * KOLIKO OVO KOŠTA: Googlebot obiđe 33.834 fotografije prosečne veličine oko
 * 60 kB — blizu 2 GB po punom obilasku, i jednako toliko poziva ove funkcije.
 * Posle prvog poziva slika stoji na CDN-u godinu dana (vidi `KES` niže), pa se
 * ponovni obilasci i posete kupaca serviraju sa ivice, bez pozivanja funkcije.
 * Na Vercel Hobby planu (100 GB saobraćaja, 1.000.000 poziva mesečno) to staje
 * sa velikom rezervom. NE ide kroz `next/image` optimizator baš zato što on ima
 * zasebnu, mnogo nižu kvotu transformacija (vidi `trebaOptimizaciju` u
 * `src/lib/slike.ts`).
 *
 * PRAVNA STRANA: fotografije su dobavljačeve. Kao njihov preprodavac smemo da
 * ih koristimo za prikaz artikala koje prodajemo — zato i stoje na sajtu. Ovim
 * ih dodatno serviramo sa svog domena i prijavljujemo Google-u. Ako neki
 * dobavljač to ospori, gasi se lako: `ProductThumb` se vrati na `slikaZa(...)`
 * umesto `nasaSlika(...)`, a `/image-sitemap.xml` prestane da ih prijavljuje.
 */

/**
 * Slika artikla se ne menja — isti kataloški kod uvek nosi istu fotografiju.
 * Kad dobavljač zameni sliku, artikal u sledećem `npm run katalog` dobije novu
 * adresu, ali isti kod, pa se keš ne bi sam osvežio. To je prihvatljivo: bolja
 * je stara fotografija tačnog artikla nego 33.834 promašaja keša mesečno.
 */
const KES = "public, max-age=31536000, s-maxage=31536000, immutable";

/** Koliko se čeka dobavljač pre nego što se odustane. */
const TAJMAUT_MS = 10_000;

const greska = (status: number, poruka: string) =>
  new Response(poruka, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      // Greška se NE kešira dugo: dobavljač koji je trenutno nedostupan ne sme
      // da ostavi rupu u Google Images na godinu dana.
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  // Adresa je `/slika/<slug>.jpg`; `.jpg` je samo za lep naziv fajla u Google
  // Images (vidi `nasaSlika` u `src/lib/slike.ts`), pa se ovde skida.
  const slug = params.slug.replace(/\.(jpe?g|png|webp|avif)$/i, "");

  // Traži se isključivo po kataloškom kodu iz slug-a — ruta sme da dohvati samo
  // ono što stoji u našem katalogu. Bez toga bi ovo bio otvoren proxy kroz koji
  // bi svako mogao da povuče bilo koju adresu preko našeg servera.
  const izvorna = slikaPoSlugu(slug);
  if (!izvorna || JE_PRAZNA_SLIKA(izvorna)) {
    return greska(404, "Nema fotografije za taj artikal.");
  }

  /*
   * `?k=detalj` — jedini razlog zbog kog ova ruta uopšte gleda query.
   *
   * Bez njega bi svaka slika išla u veličini za karticu, pa bi fotografija na
   * stranici artikla izgubila oštrinu koju danas ima: vipmobil ima samo `rs_`
   * (300×300) i original (3264×3264), a gsmexpert daje 500 px za karticu i 800
   * za detalj. `slikaZa(..., "detalj")` bira tačno ono što je stranica artikla
   * i do sada tražila direktno od dobavljača.
   *
   * Adresa BEZ query-ja ostaje kanonska — nju vide spiskovi, image sitemap i
   * Googlebot, i za nju važi `izvorZaIndeks` (najveća varijanta koja je i dalje
   * lagana za 33.834 obilaska). Dve adrese znače i dva zapisa na CDN-u, što je
   * u redu: samo se otvoreni artikli keširaju u obe veličine.
   */
  const detaljno =
    new URL(request.url).searchParams.get("k") === "detalj";
  const adresa = detaljno
    ? slikaZa(izvorna, "detalj") ?? izvorna
    : izvorZaIndeks(izvorna);

  let odgovor: Response;
  try {
    odgovor = await fetch(adresa, {
      signal: AbortSignal.timeout(TAJMAUT_MS),
      headers: {
        // Deo izvora vraća HTML stranicu greške kad zaglavlja izgledaju
        // „botovski"; tražimo izričito sliku.
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
      },
    });
  } catch {
    return greska(502, "Fotografija trenutno nije dostupna.");
  }

  if (!odgovor.ok || !odgovor.body) {
    return greska(502, "Fotografija trenutno nije dostupna.");
  }

  const tip = odgovor.headers.get("content-type") ?? "";
  // Dobavljač koji je pao ume da vrati HTML stranicu sa statusom 200 — bez ove
  // provere bi taj HTML završio na CDN-u kao „slika" na godinu dana.
  if (!tip.startsWith("image/")) {
    return greska(502, "Izvor nije vratio sliku.");
  }

  const duzina = odgovor.headers.get("content-length");

  // Telo se prosleđuje kao tok — slika ne prolazi kroz memoriju funkcije.
  return new Response(odgovor.body, {
    headers: {
      "Content-Type": tip,
      ...(duzina ? { "Content-Length": duzina } : {}),
      "Cache-Control": KES,
    },
  });
}
