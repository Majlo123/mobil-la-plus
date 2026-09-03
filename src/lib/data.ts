/**
 * Sadržaj sajta — kategorije asortimana, usluge servisa, prednosti.
 *
 * Sami proizvodi NISU ovde — dolaze iz veleprodajnih kataloga,
 * vidi `src/lib/catalog.ts` i `npm run katalog`.
 *
 * Usluge i prednosti su prepisane sa zvaničnog flajera firme, ne izmišljene.
 */

import type { LucideIcon } from "lucide-react";
import {
  Smartphone,
  ShieldCheck,
  Plug,
  BatteryCharging,
  MonitorSmartphone,
  Headphones,
  Watch,
  MemoryStick,
  Wrench,
  Cable,
  Zap,
  DatabaseBackup,
  KeyRound,
  Truck,
  ThumbsUp,
  Settings,
  Users,
  Package,
  Package2,
} from "lucide-react";

/* -------------------------------- Kategorije ------------------------------- */

/**
 * Ključevi moraju da odgovaraju `tip` fasetama iz `src/data/products.json`
 * (vidi `TIPOVI` u scripts/telefoni-dictionary.mjs) — po njima filtrira
 * katalog na `/prodavnica?tip=...`.
 */
export type CategoryKey =
  | "maske"
  | "stakla"
  | "punjaci"
  | "kablovi"
  | "baterije"
  | "ekrani"
  | "audio"
  | "powerbank"
  | "telefoni"
  | "satovi"
  | "memorije"
  | "delovi"
  | "ostalo";

export type Category = {
  key: CategoryKey;
  label: string;
  short: string;
  description: string;
  icon: LucideIcon;
  /** Istaknuta na početnoj strani (mreža kategorija). */
  featured?: boolean;
};

export const categories: Category[] = [
  {
    key: "maske",
    label: "Maske i futrole",
    short: "Maske",
    description:
      "Silikonske, providne, kožne i maske sa štampom — za sve popularne modele. Maske po želji radimo sa vašom slikom.",
    icon: Smartphone,
    featured: true,
  },
  {
    key: "stakla",
    label: "Zaštitna stakla i folije",
    short: "Stakla i folije",
    description:
      "Kaljena stakla 2.5D i 5D full glue, privacy stakla, folije za displej i zaštita za kameru — postavljamo na mestu.",
    icon: ShieldCheck,
    featured: true,
  },
  {
    key: "punjaci",
    label: "Punjači",
    short: "Punjači",
    description:
      "Kućni i auto punjači, brzo punjenje, USB-C i Lightning — originalni i kvalitetni zamenski.",
    icon: Plug,
    featured: true,
  },
  {
    key: "kablovi",
    label: "Kablovi i adapteri",
    short: "Kablovi",
    description:
      "USB-C, Lightning i micro USB kablovi, audio i SIM adapteri — različite dužine i jačine.",
    icon: Cable,
    featured: true,
  },
  {
    key: "baterije",
    label: "Baterije",
    short: "Baterije",
    description:
      "Zamenske baterije za iPhone, Samsung, Xiaomi, Honor i ostale — sa ugradnjom i garancijom.",
    icon: BatteryCharging,
    featured: true,
  },
  {
    key: "ekrani",
    label: "Ekrani i LCD",
    short: "Ekrani",
    description:
      "LCD i OLED ekrani sa touch screenom — originalni, service pack i kvalitetni zamenski, sa ugradnjom.",
    icon: MonitorSmartphone,
    featured: true,
  },
  {
    key: "audio",
    label: "Slušalice i zvučnici",
    short: "Audio",
    description:
      "Bežične i žičane slušalice, bluetooth zvučnici i audio adapteri.",
    icon: Headphones,
    featured: true,
  },
  {
    key: "powerbank",
    label: "Power bank i držači",
    short: "Power bank",
    description:
      "Prenosive baterije, auto i stoni držači, magnetni holderi i FM transmiteri.",
    icon: Zap,
    featured: true,
  },
  {
    key: "telefoni",
    label: "Telefoni",
    short: "Telefoni",
    description:
      "Novi i refabrikovani mobilni telefoni — Samsung, Xiaomi, Nokia i ostali, uz garanciju.",
    icon: Package,
    featured: true,
  },
  {
    key: "satovi",
    label: "Pametni satovi",
    short: "Satovi",
    description: "Smart satovi i narukvice, sa dodatnim narukvicama i zaštitom.",
    icon: Watch,
  },
  {
    key: "memorije",
    label: "Memorijske kartice",
    short: "Memorije",
    description: "microSD kartice i USB flash memorije različitih kapaciteta.",
    icon: MemoryStick,
  },
  {
    key: "delovi",
    label: "Servisni delovi i alat",
    short: "Delovi i alat",
    description:
      "Flet kablovi, zvučnici, poklopci, kamere, lepkovi i serviserski alat — za majstore i servise.",
    icon: Wrench,
  },
  {
    key: "ostalo",
    label: "Ostala oprema",
    short: "Ostalo",
    description:
      "Olovke za ekran, kanapi i privesci, SIM adapteri i sitna oprema koja ne staje u ostale kategorije.",
    icon: Package2,
  },
];

export const categoryLabel = (key: string) =>
  categories.find((c) => c.key === key)?.label ?? key;

export const featuredCategories = categories.filter((c) => c.featured);

/* ---------------------------------- Servis --------------------------------- */

export type Usluga = {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Kratke stavke koje se prikazuju kao lista na stranici servisa. */
  stavke?: string[];
};

/** Usluge servisa — prepisano sa flajera. */
export const usluge: Usluga[] = [
  {
    key: "servis",
    title: "Kompletan servis mobilnih telefona",
    description:
      "Koristimo najbolji alat i opremu za servis. U telefone ugrađujemo originalne ili kvalitetne zamenske delove — na Vama je izbor.",
    icon: Wrench,
    stavke: [
      "Zamena ekrana i touch screena",
      "Zamena baterije",
      "Zamena konektora za punjenje",
      "Zamena zadnjeg poklopca i stakla kamere",
      "Zamena zvučnika i mikrofona",
      "Popravka nakon kvara od vlage",
    ],
  },
  {
    key: "frp",
    title: "Skidanje Google naloga (FRP)",
    description:
      "Zaključan telefon posle reseta? Skidamo Google nalog (FRP zaštitu) sa Vašeg telefona i vraćamo ga u upotrebu.",
    icon: KeyRound,
  },
  {
    key: "podaci",
    title: "Spašavanje podataka sa uništenih telefona",
    description:
      "Najsavremenijim metodama vraćamo slike, kontakte i poruke i sa telefona koji više ne pale — kada drugi kažu da nema šanse.",
    icon: DatabaseBackup,
  },
  {
    key: "kurir",
    title: "Prijem telefona kurirskom službom",
    description:
      "Ukoliko se ne nalazite u Novom Sadu, telefon nam možete poslati kurirskom službom — javite se za dogovor pre slanja.",
    icon: Truck,
  },
];

/* -------------------------------- Prednosti -------------------------------- */

export type Advantage = {
  title: string;
  description: string;
  icon: LucideIcon;
};

/** Četiri poruke sa dna flajera. */
export const advantages: Advantage[] = [
  {
    title: "Profesionalna oprema",
    description:
      "Radimo alatom i opremom napravljenom za mikroelektroniku — bez improvizacije i bez dodatnih šteta na uređaju.",
    icon: Settings,
  },
  {
    title: "Brza i kvalitetna usluga",
    description:
      "Većinu popravki rešavamo isti dan. Ako deo mora da se poruči, unapred kažemo rok — bez odugovlačenja.",
    icon: ThumbsUp,
  },
  {
    title: "Garancija na ugrađene delove",
    description:
      "Na svaki ugrađen deo dajemo garanciju. Kažemo tačno da li je deo originalan, service pack ili kvalitetan zamenski.",
    icon: ShieldCheck,
  },
  {
    title: "Zadovoljstvo kupaca",
    description:
      "Objasnimo kvar ljudskim jezikom i damo cenu pre početka rada — da znate na čemu ste.",
    icon: Users,
  },
];

/* ------------------------------------ FAQ ---------------------------------- */

export type Faq = { q: string; a: string };

export const faq: Faq[] = [
  {
    q: "Koliko traje zamena ekrana ili baterije?",
    a: "Za najčešće modele deo imamo na lageru i popravku završavamo isti dan, obično u roku od jednog do dva sata. Ako model nije uobičajen, deo poručujemo i unapred vam kažemo rok.",
  },
  {
    q: "Ugrađujete originalne ili zamenske delove?",
    a: "Oba — izbor je Vaš. Objasnimo razliku u ceni i kvalitetu (originalni, service pack, kvalitetan zamenski) i vi odlučujete. Na svaki ugrađen deo ide garancija.",
  },
  {
    q: "Da li su cene na sajtu konačne?",
    a: "Cene u prodavnici su maloprodajne za artikal. Za uslugu ugradnje i za artikle koji nisu na lageru javite se na Viber, WhatsApp ili telefon — potvrdimo dostupnost i konačnu cenu pre bilo kakvog rada.",
  },
  {
    q: "Nisam iz Novog Sada — možete li mi popraviti telefon?",
    a: "Da. Telefon nam pošaljite kurirskom službom na Braće Ribnikar 17, Novi Sad. Pozovite ili pišite pre slanja da se dogovorimo oko kvara i načina vraćanja.",
  },
  {
    q: "Radite li maske po želji?",
    a: "Da, radimo maske sa Vašom slikom ili dizajnom. Pošaljite sliku na Viber ili WhatsApp i recite model telefona.",
  },
  {
    q: "Može li se telefon spasiti ako je pao u vodu?",
    a: "Često može, ali je bitno da se ne uključuje i ne puni. Donesite ga što pre — što duže vlaga stoji, veća je korozija. Radimo i spašavanje podataka sa uređaja koji više ne pale.",
  },
];
