/**
 * Izbor veličine fotografije artikla po izvoru i kadru.
 *
 * Katalog čuva adresu slike onako kako stoji na sajtu dobavljača, a to su
 * SLIČICE za njihove liste — premale za naše kartice, pa izgledaju mutno:
 *
 *   gsmexpert.rs   120×120     (timthumb, veličina je u query stringu)
 *   gsm3g.com      270×270     (sufiks `_w270` u imenu fajla)
 *   vipmobil.net   300×300     (prefiks `rs_` = resized small)
 *
 * Svaki od njih ima veću varijantu, ali na drugačiji način — zato ovaj modul.
 * Izmereno na živim slikama:
 *
 *   gsmexpert  w=500  → 500×500,   121 kB   (w=800 → 286 kB, preskupo za mrežu)
 *   gsm3g      _w1000 → 1000×1000,  23–58 kB  (jedina veća varijanta, i lagana)
 *   vipmobil   bez rs_ → 3264×3264, 1.118 kB  (original; NEMA srednje veličine)
 *
 * Zato vipmobil original ide SAMO na stranicu artikla, i to kroz Next-ov
 * optimizer — u mreži od 24 kartice to bi bilo 27 MB po strani.
 */

export type Kadar = "kartica" | "detalj";

const GSMEXPERT_PX: Record<Kadar, number> = { kartica: 500, detalj: 800 };

/**
 * Adresa slike prilagođena kadru. Nepoznat oblik adrese vraća se nepromenjen —
 * kad dobavljač promeni šemu, slika ostaje ista kao pre, ne puca.
 */
export function slikaZa(src: string | undefined, kadar: Kadar): string | undefined {
  if (!src) return undefined;

  // gsmexpert: timthumb prima bilo koju veličinu preko `w`/`h`.
  if (src.includes("timthumb.php")) {
    const px = GSMEXPERT_PX[kadar];
    return src.replace(/([?&])w=\d+/, `$1w=${px}`).replace(/([&?])h=\d+/, `$1h=${px}`);
  }

  // gsm3g: širina je sufiks u imenu fajla. Postoje samo `_w270` i `_w1000`, a
  // veća je toliko lagana da je uzimamo i za kartice.
  if (src.includes("blob.core.windows.net")) {
    return src.replace(/_w270(?=\.[a-z]+$)/i, "_w1000");
  }

  // vipmobil: `rs_` je jedina umanjena varijanta; original nema srednju meru.
  if (src.includes("vipmobil.net")) {
    return kadar === "detalj" ? src.replace("/rs_", "/") : src;
  }

  return src;
}

/**
 * Da li sliku treba pustiti kroz Next-ov optimizer.
 *
 * Po pravilu NE: slike dobavljača su već male i optimizacija bi samo trošila
 * kvotu transformacija hostinga na 30.000+ artikala.
 *
 * Izuzetak je vipmobil original na stranici artikla — 3264×3264 i preko 1 MB.
 * Njega optimizer smanji na potrebnu veličinu i pretvori u WebP, pa se troši
 * kvota samo za artikle koje neko stvarno otvori.
 */
export function trebaOptimizaciju(src: string | undefined, kadar: Kadar): boolean {
  if (!src) return false;
  return kadar === "detalj" && src.includes("vipmobil.net") && !src.includes("/rs_");
}

/**
 * Placeholder koji vipmobil vraća za artikle bez prave fotografije.
 * Takva slika nije fotografija proizvoda, pa je bolje prikazati naš brendiran
 * tile nego tuđu sivu ikonicu.
 */
export const JE_PRAZNA_SLIKA = (src: string | undefined) =>
  !!src && /default_product|no[-_]image|placeholder/i.test(src);
