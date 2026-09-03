import type { MetadataRoute } from "next";

const BASE = "https://mobilplusla.rs";

/**
 * Ceo sajt je otvoren za obilazak — nema korisničkih naloga, korpe ni stranica
 * sa privatnim podacima, pa nema šta da se zabranjuje.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    // Dva sitemap-a: URL-ovi svih stranica + poseban image sitemap za fotografije.
    sitemap: [`${BASE}/sitemap.xml`, `${BASE}/image-sitemap.xml`],
    host: BASE,
  };
}
