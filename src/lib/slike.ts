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

/* -------------------------- Slike na našem domenu -------------------------- */

/**
 * Adresa fotografije artikla NA NAŠEM DOMENU.
 *
 * ZAŠTO POSTOJI: Google Images indeksira sliku pod domenom koji je SERVIRA. Dok
 * je `<img src>` puna adresa na `gsmexpert.rs` ili `vipmobil.net`, ta slika u
 * Google Images pripada njima — koliko god dobar bio naš alt tekst i naslov
 * strane. Prijaviti tuđu adresu u našem image sitemap-u ne pomaže: Google
 * prijavljene slike sa tuđeg hosta ignoriše bez cross-domain potvrde u Search
 * Console-u, a taj domen nije naš.
 *
 * Zato ide preko `/slika/[slug]` rute: ona preuzme sliku sa dobavljača i
 * servira je sa našeg domena, uz keširanje na CDN-u (vidi route handler).
 *
 * Ime fajla je namerno pun slug artikla — u Google Images naziv fajla je jedan
 * od signala o čemu je slika, pa `/slika/ekran-za-iphone-13-ge-13506.jpg` govori
 * više nego `93301190-b149-431b-b7b2-bf271b6a1689_w270.jpg` kod dobavljača.
 *
 * Ekstenzija je uvek `.jpg` iako deo izvora vraća PNG. Google ide po
 * `Content-Type` zaglavlju, ne po ekstenziji, a jedna ekstenzija znači da se
 * adresa slike izvodi iz slug-a bez ijednog pogleda u katalog.
 *
 * `kadar` bira veličinu koju ruta traži od dobavljača — isti izbor kao kod
 * `slikaZa`, samo prenet u query. Adresa BEZ query-ja (kadar „kartica") je ona
 * koja stoji na svim spiskovima i koja ide u image sitemap; „detalj" postoji da
 * stranica artikla ne izgubi oštrinu koju danas ima (vidi `izvorZaIndeks`).
 */
export const nasaSlika = (slug: string, kadar: Kadar = "kartica") =>
  kadar === "detalj" ? `/slika/${slug}.jpg?k=detalj` : `/slika/${slug}.jpg`;

/**
 * Koju veličinu ruta traži od dobavljača.
 *
 * Nije isto što i `slikaZa(src, "detalj")`: tamo vipmobil daje original od
 * 3264×3264 i preko 1 MB, što je u redu za jedan artikal koji je neko otvorio,
 * ali ne i za 12.479 fotografija koje Googlebot obiđe redom — to bi bilo blizu
 * 14 GB saobraćaja po obilasku.
 *
 * Ovde se zato uzima najveća varijanta koja je i dalje lagana:
 *   gsm3g      `_w1000` → 1000×1000, 23–58 kB
 *   gsmexpert  `w=500`  →  500×500,  ~120 kB
 *   vipmobil   `rs_`    →  300×300,  ~24 kB   (nema srednju veličinu)
 *
 * Za Google Images je i 300 px dovoljno da slika uđe u indeks — rang mnogo više
 * zavisi od naziva fajla, alt teksta i sadržaja strane oko slike.
 *
 * To je tačno kadar „kartica"; funkcija postoji da bi ta veza bila NAMERNA i
 * imenovana — kad bi neko sutra povećao karticu, ovde se vidi da to menja i ono
 * što Googlebot povlači 33.834 puta.
 */
export const izvorZaIndeks = (src: string) => slikaZa(src, "kartica") ?? src;

/**
 * Placeholder koji vipmobil vraća za artikle bez prave fotografije.
 * Takva slika nije fotografija proizvoda, pa je bolje prikazati naš brendiran
 * tile nego tuđu sivu ikonicu.
 */
export const JE_PRAZNA_SLIKA = (src: string | undefined) =>
  !!src && /default_product|no[-_]image|placeholder/i.test(src);
