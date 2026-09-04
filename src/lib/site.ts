/**
 * JEDAN IZVOR ISTINE za sve kontakt podatke, linkove i NAP informacije.
 * ZAMENI vrednosti ovde kad se nešto promeni — menja se na celom sajtu.
 *
 * Podaci su sa zvaničnog flajera i logotipa firme (vidi public/images/brend/).
 */

/**
 * Podrazumevana poruka za Viber/WhatsApp kad korisnik ne bira konkretan artikal.
 *
 * Stoji IZVAN `site` objekta namerno: kad se koristila kao `site.defaultInquiry`
 * u podrazumevanom parametru metode istog objekta, TypeScript je `site` video kao
 * kružnu referencu u sopstvenom inicijalizatoru i celom objektu dodelio tip
 * `any` — što je onda gasilo proveru tipova svuda gde se `site` koristi.
 */
const PODRAZUMEVAN_UPIT = "Zdravo, zanima me ponuda iz vaše prodavnice.";

/** Domen na koji sajt ide kad se registruje i uveže. */
const KONACNI_DOMEN = "https://www.mobil-plus-la.com";

/**
 * Apsolutna adresa sajta — koristi se za canonical linkove, OG slike, sitemap,
 * robots.txt i JSON-LD. JEDAN izvor istine; ne ponavljaj je po stranama.
 *
 * Redosled je bitan:
 *  1. `NEXT_PUBLIC_SITE_URL` — postavi je kad pravi domen proradi.
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — stabilan produkcijski domen projekta
 *     na Vercel-u (npr. `mobil-la-plus.vercel.app`). NE koristimo `VERCEL_URL`,
 *     jer se ona menja pri svakom deploy-u, pa bi canonical linkovi pokazivali
 *     na adresu koja zastari čim stigne sledeći build.
 *  3. Konačni domen — za lokalni rad i kad ničega nema.
 *
 * Vrednost se peče u build-u (strane su statičke), pa promena promenljive traži
 * novi deploy.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : KONACNI_DOMEN)
).replace(/\/+$/, "");

/**
 * Da li sajt trenutno stoji na svom pravom domenu.
 *
 * Dok radi na `*.vercel.app`, ne sme da se indeksira: Google bi upamtio
 * privremenu adresu, pa bi ista sadržina kasnije postojala na dva domena i
 * pravi domen bi se takmičio sam sa sobom.
 *
 * Proverava se OBLIK hosta (nije `*.vercel.app`), ne tačna jednakost sa
 * `KONACNI_DOMEN` — Vercel sam postavlja `VERCEL_PROJECT_PRODUCTION_URL` na
 * povezani domen (apex ili `www`, šta je od to dvoje podešeno kao glavno),
 * pa ovo radi bez ručnog podešavanja `NEXT_PUBLIC_SITE_URL` na hostingu.
 */
export const NA_PRAVOM_DOMENU = !new URL(SITE_URL).hostname.endsWith(".vercel.app");

/**
 * Stabilan identifikator firme u strukturiranim podacima.
 *
 * Isti `@id` nose `MobilePhoneStore` iz layout-a, `LocalBusiness` sa `/kontakt`
 * i `publisher` u `WebSite` bloku — tako Google sve to spaja u JEDAN entitet,
 * umesto da vidi tri firme sa istim imenom i adresom.
 */
export const ID_FIRME = `${SITE_URL}/#mobilplusla`;

/** Apsolutna adresa iz putanje — `abs("/servis")` → `https://…/servis`. */
export const abs = (putanja: string) => `${SITE_URL}${putanja}`;

export const site = {
  name: "Mobil Plus LA",
  legalName: "Mobil Plus LA",
  slogan: "Servis i oprema za mobilne telefone",
  city: "Novi Sad",
  description:
    "Kompletan servis mobilnih telefona u Novom Sadu — zamena ekrana i baterija, skidanje Google naloga (FRP) i spašavanje podataka. Uz servis prodajemo maske, zaštitna stakla, folije, punjače, auto punjače i kablove.",

  /* ----------------------------- Kontakt (NAP) ----------------------------- */

  // Primarni broj — ide na Viber, WhatsApp i tel: linkove.
  phoneDisplay: "061 119 3567",
  phoneIntl: "+381611193567",
  // Dodatni broj — prikazuje se u zaglavlju/futeru, bez Viber/WhatsApp linkova.
  phoneAltDisplay: "067 766 6662",
  phoneAltIntl: "+381677666662",
  email: "mobilplusns1@gmail.com",

  address: {
    street: "Braće Ribnikar 17",
    city: "Novi Sad",
    postalCode: "21000",
    region: "Vojvodina",
    country: "Srbija",
    full: "Braće Ribnikar 17, Novi Sad 21000, Srbija",
    // ZAMENI: prave koordinate radnje za precizan pin na mapi.
    lat: 45.2517,
    lng: 19.8369,
  },

  hours: [
    // ZAMENI: pravo radno vreme radnje.
    { day: "Ponedeljak – Petak", time: "09:00 – 19:00" },
    { day: "Subota", time: "09:00 – 14:00" },
    { day: "Nedelja", time: "Zatvoreno" },
  ],

  socials: {
    instagram: "https://www.instagram.com/mobil.plus_la/",
    instagramHandle: "mobil.plus_la",
    website: SITE_URL,
  },

  /* -------------------------- Brzi kontakt linkovi ------------------------- */

  /** Poruka koja se predpopuni u Viber/WhatsApp kad korisnik ne bira proizvod. */
  defaultInquiry: PODRAZUMEVAN_UPIT,

  get telHref() {
    return `tel:${this.phoneIntl}`;
  },
  get telAltHref() {
    return `tel:${this.phoneAltIntl}`;
  },
  get mailHref() {
    return `mailto:${this.email}`;
  },
  /** WhatsApp klik-na-chat; `text` je opciona predpopunjena poruka. */
  whatsappHref(text: string = PODRAZUMEVAN_UPIT) {
    return `https://wa.me/${this.phoneIntl.replace("+", "")}?text=${encodeURIComponent(text)}`;
  },
  /**
   * Viber deep link. `viber://chat?number=` očekuje broj BEZ „+" — sa plusom
   * aplikacija na delu uređaja otvori prazan ekran umesto konverzacije.
   */
  viberHref(text: string = PODRAZUMEVAN_UPIT) {
    const num = this.phoneIntl.replace("+", "");
    return `viber://chat?number=${num}&draft=${encodeURIComponent(text)}`;
  },
} as const;

/** Predpopunjena poruka za upit o konkretnom proizvodu. */
export const inquiryFor = (naziv: string, cena?: string) =>
  cena
    ? `Zdravo, zanima me: ${naziv} (${cena}). Da li je dostupno?`
    : `Zdravo, zanima me: ${naziv}. Da li je dostupno?`;

export type NavItem = { label: string; href: string };

export const nav: NavItem[] = [
  { label: "Prodavnica", href: "/prodavnica" },
  { label: "Servis telefona", href: "/servis" },
  { label: "O nama", href: "/o-nama" },
  { label: "Kontakt", href: "/kontakt" },
];
