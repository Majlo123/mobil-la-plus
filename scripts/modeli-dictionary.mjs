/**
 * Rečnik KANONSKIH MODELA TELEFONA — za filter „Model telefona" u prodavnici.
 *
 * ZAŠTO POSTOJI: nazivi kod dobavljača daju 7.918 različitih varijanti modela.
 * Samo „S23" se javlja kao „Galaxy S23", „Samsung S911B Galaxy S23",
 * „Samsung S911B Galaxy S23 roze", „Samsung S916B Galaxy S23 Plus mint"… a
 * „iPhone 15" u 191 varijanti. Takav podatak ne može da bude filter.
 *
 * Model se zato NE ČISTI iz naziva nego se PREPOZNAJE: ovde stoji spisak pravih
 * modela sa obrascima, a `scripts/build-catalog.mjs` svakom artiklu dodeli prvi
 * model koji se poklopi.
 *
 * PRAVILA ZA DOPUNU:
 *  - `match` obrasci se testiraju nad NORMALIZOVANIM nazivom artikla (mala
 *    slova, bez dijakritike), pa pišu se malim slovima i bez „č/ć/š/ž/đ".
 *  - Uvek koristi granice reči `\b`. Bez njih „s2" hvata i s20, s21, s25…
 *  - REDOSLED JE BITAN — specifičniji model ide PRVI. „Galaxy S23 Ultra" mora
 *    da stoji pre „Galaxy S23", inače bi obrazac za S23 pojeo i Ultra.
 *  - Kad redosled nije dovoljan, koristi `exclude` — obrazac koji anulira pogodak.
 *  - Obavezno navedi i FABRIČKE ŠIFRE iz podataka (S918B, SM-F776B, A135F…):
 *    kod dela artikala je šifra jedini podatak u nazivu.
 *  - Varijante boje i memorije NE razdvajaj — kupcu treba „Galaxy S23", ne
 *    „Galaxy S23 roze 256GB". Ali „A13 4G" i „A13 5G" SU različiti telefoni.
 *
 * Posle svake izmene pokreni `npm run katalog` i pogledaj izveštaj (pokrivenost
 * modela i `data/modeli-nepokriveno.json`).
 */

/**
 * @typedef {object} Model
 * @property {string} key    kebab-case ključ, ide u URL (`?model=galaxy-s23`)
 * @property {string} label  naziv koji vidi kupac
 * @property {string} brand  ključ marke iz `BRENDOVI` u telefoni-dictionary.mjs
 * @property {RegExp[]} match
 * @property {RegExp[]} [exclude]
 */

/** @type {Model[]} */
export const MODELI = [];
