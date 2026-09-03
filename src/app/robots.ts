import type { MetadataRoute } from "next";
import { NA_PRAVOM_DOMENU, SITE_URL } from "@/lib/site";

/**
 * Ceo sajt je otvoren za obilazak — nema korisničkih naloga, korpe ni stranica
 * sa privatnim podacima, pa nema šta da se zabranjuje.
 *
 * IZUZETAK: dok sajt stoji na privremenom domenu (`*.vercel.app`, pre nego što
 * se poveže `mobil-plus-la.com`), obilazak se ZABRANJUJE u celosti. Inače bi Google
 * zapamtio privremenu adresu, a kad pravi domen proradi ista sadržina bi
 * postojala na dva mesta — pravi domen bi se takmičio sam sa sobom za poziciju.
 *
 * Zabrana ne utiče na deljenje linka: sajt radi normalno i otvara se svakome
 * kome pošalješ adresu. Skida se sama čim se domen poveže na Vercel-u — vidi
 * `NA_PRAVOM_DOMENU` u `src/lib/site.ts` (ne treba ručno podešavanje env
 * promenljive, samo novi deploy posle povezivanja domena).
 */
export default function robots(): MetadataRoute.Robots {
  if (!NA_PRAVOM_DOMENU) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    // Dva sitemap-a: URL-ovi svih stranica + poseban image sitemap za fotografije.
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/image-sitemap.xml`],
    host: SITE_URL,
  };
}
