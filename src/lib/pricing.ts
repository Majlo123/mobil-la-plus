/**
 * Prikaz cena.
 *
 * Ovde NEMA formule za maržu — prodajne cene se izračunaju u build-u kataloga i
 * upišu u `src/data/products.json`. Formula živi na jednom mestu:
 * `scripts/pricing.mjs`. Tako runtime ne može da se raziđe sa onim što je
 * napisano u katalogu.
 *
 * Kupcu se cena prikazuje samo u dinarima (odluka vlasnika).
 */

/**
 * „2340" → „2.340 RSD". Bez decimala — dinar se u maloprodaji ne cepa.
 * Za `null` (artikal bez nabavne cene na izvoru) vraća „Cena na upit", pa
 * kartica nikad ne prikazuje izmišljen broj.
 */
export function formatRsd(rsd: number | null | undefined): string {
  if (typeof rsd !== "number" || !Number.isFinite(rsd)) return "Cena na upit";
  return `${rsd.toLocaleString("sr-RS", { maximumFractionDigits: 0 })} RSD`;
}

/** Ima li artikal cenu — za uslovni prikaz „Kontaktiraj za cenu". */
export const imaCenu = (rsd: number | null | undefined): rsd is number =>
  typeof rsd === "number" && Number.isFinite(rsd);
