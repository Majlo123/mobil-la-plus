import type { MetadataRoute } from "next";
import {
  getAllProducts,
  productHref,
  productTypes,
  productBrands,
  katalogBrojStrana,
} from "@/lib/products";
import { kategorijaHref, brendHref } from "@/lib/catalog";

const BASE = "https://mobilplusla.rs";

/**
 * Sitemap svih stranica (početna, kategorije, kataloški indeks, svaki artikal).
 *
 * Fotografije NISU ovde: ugrađeni Next 14 sitemap ne ume da upiše `<image:image>`.
 * Za Google Images postoji poseban `/image-sitemap.xml` (vidi route handler),
 * a oba su prijavljena u `robots.ts`.
 *
 * Jedan sitemap fajl staje do 50.000 URL-ova. Katalog je trenutno oko 2.000
 * artikala, ali raste sa svakim novim dobavljačem u `npm run katalog` — ako se
 * ikad približi granici, ovde se uvodi `generateSitemaps()` sa deljenjem po
 * vrsti artikla.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    // Prodavnica i servis su dve stvari zbog kojih ljudi i dolaze — zato oba
    // idu na vrh, iako servis ima jednu stranicu a prodavnica hiljade.
    { url: `${BASE}/prodavnica`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/servis`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/o-nama`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Kategorijske stranice — one nose pretrage tipa „zaštitno staklo Novi Sad".
  const kategorije: MetadataRoute.Sitemap = productTypes().map((t) => ({
    url: `${BASE}${kategorijaHref(t.key)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Stranice po brendu telefona — „maska za Xiaomi Redmi", „baterija za iPhone".
  const brendovi: MetadataRoute.Sitemap = productBrands().map((b) => ({
    url: `${BASE}${brendHref(b.key)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Kataloški indeks — jedini put kojim svaki artikal dobija interni link
  // (prodavnica filtrira preko URL-a, pa Googlebot sam ne dođe do svega).
  // Nizak prioritet: te strane su za obilazak, ne za ljude.
  const katalog: MetadataRoute.Sitemap = Array.from(
    { length: katalogBrojStrana() },
    (_, i) => ({
      url: `${BASE}/katalog/${i + 1}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.3,
    }),
  );

  // Artikal sa cenom je gotova stranica; „Cena na upit" znači da nabavna cena
  // nije proverena (vidi data/cene-za-proveru.json), pa ide niže.
  const proizvodi: MetadataRoute.Sitemap = getAllProducts().map((p) => ({
    url: `${BASE}${productHref(p)}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: p.price === null ? 0.4 : 0.6,
  }));

  return [...staticRoutes, ...kategorije, ...brendovi, ...katalog, ...proizvodi];
}
