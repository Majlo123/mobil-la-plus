/**
 * JEDAN IZVOR ISTINE za formiranje prodajne cene iz nabavne.
 *
 * Cene se peku u `src/data/products.json` u build-u kataloga, pa runtime-u
 * formula nije potrebna — `src/lib/pricing.ts` sadrži samo formatiranje.
 * Time nema dve kopije formule koje mogu da se raziđu.
 *
 * Marža je stepenasta — što je artikal jeftiniji, veći je množilac, jer se na
 * sitnoj robi zarađuje procentualno, ne po komadu:
 *
 *   do 1,5 €      → ×6      (uključuje i sve ispod 1 € — potvrđeno sa vlasnikom)
 *   1,5 – 2,5 €   → ×4
 *   2,5 – 3 €     → ×3
 *   preko 3 €     → ×2,5
 *
 * Granice su INKLUZIVNE po gornjoj vrednosti: 1,50 € ide u ×6, a 1,51 € u ×4.
 * Tako svaka granična cena pripada baš jednom razredu, bez rupa i preklapanja.
 */

/**
 * Kurs za preračun. Menja se ručno — ZAMENI kad se kurs bitno promeni i
 * pokreni `npm run katalog` da se cene ponovo izračunaju.
 */
export const EUR_RSD = 117.5;

/** Redom, od najjeftinijeg razreda ka najskupljem. `doEur: null` = sve preko. */
export const RAZREDI = [
  { doEur: 1.5, mnozilac: 6, opis: "do 1,50 €" },
  { doEur: 2.5, mnozilac: 4, opis: "1,50 – 2,50 €" },
  { doEur: 3, mnozilac: 3, opis: "2,50 – 3,00 €" },
  { doEur: null, mnozilac: 2.5, opis: "preko 3,00 €" },
];

/** Množilac za nabavnu cenu u evrima. */
export function mnozilac(nabavnaEur) {
  for (const r of RAZREDI) {
    if (r.doEur === null || nabavnaEur <= r.doEur) return r.mnozilac;
  }
  return RAZREDI[RAZREDI.length - 1].mnozilac;
}

/**
 * Zaokruživanje na najbližih 10 dinara — cena „2.340" izgleda kao cena, a
 * „2.337,64" izgleda kao greška u tabeli.
 */
export const zaokruzi = (rsd) => Math.round(rsd / 10) * 10;

const valjana = (n) => typeof n === "number" && Number.isFinite(n) && n > 0;

/**
 * Prodajna cena u dinarima iz nabavne u EVRIMA (vipmobil, gsm3g).
 * Vraća `null` za nedostajuću ili nevalidnu nabavnu cenu — u katalogu se tada
 * prikazuje „Cena na upit" umesto izmišljenog broja.
 */
export function prodajnaIzEur(nabavnaEur) {
  if (!valjana(nabavnaEur)) return null;
  return zaokruzi(nabavnaEur * mnozilac(nabavnaEur) * EUR_RSD);
}

/**
 * Prodajna cena u dinarima iz nabavne u DINARIMA (gsmexpert).
 * Razred se i dalje bira po EUR vrednosti, pa kurs služi samo za to.
 */
export function prodajnaIzRsd(nabavnaRsd) {
  if (!valjana(nabavnaRsd)) return null;
  return zaokruzi(nabavnaRsd * mnozilac(nabavnaRsd / EUR_RSD));
}
