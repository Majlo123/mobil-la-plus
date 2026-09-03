/**
 * Rečnik za klasifikaciju artikala iz veleprodajnih kataloga.
 *
 * Ovde se menja SVA logika prevođenja tuđih kategorija i naziva u naš katalog.
 * Koristi ga `scripts/build-catalog.mjs`.
 *
 * Osnovni princip: KATEGORIJA IZVORA je autoritet za vrstu artikla, a naziv se
 * koristi samo za brend i model. Kategorije na oba sajta su homogene (u
 * „futrole" su samo futrole), dok su nazivi neuredni i mešaju srpski i engleski
 * („TPU CLEAR STRONG for SM-F776B"), pa bi klasifikacija po nazivu grešila.
 */

/* --------------------------------- Tipovi ---------------------------------- */

/** Ključevi MORAJU da odgovaraju `CategoryKey` iz `src/lib/data.ts`. */
export const TIPOVI = {
  maske: "Maske i futrole",
  stakla: "Zaštitna stakla i folije",
  punjaci: "Punjači",
  kablovi: "Kablovi i adapteri",
  baterije: "Baterije",
  ekrani: "Ekrani i LCD",
  audio: "Slušalice i zvučnici",
  powerbank: "Power bank i držači",
  telefoni: "Telefoni",
  satovi: "Pametni satovi",
  memorije: "Memorijske kartice",
  delovi: "Servisni delovi i alat",
  ostalo: "Ostala oprema",
};

/* -------------------- Mapa: kategorija izvora → naš tip -------------------- */

/**
 * Ključ je „<izvor>|<putanja kategorije>" tačno onako kako stoji u harvest
 * fajlu. Kategorija koja se ne nađe ovde ide u `delovi` i ispisuje se kao
 * upozorenje u build-u — da nova kategorija na izvoru ne prođe nezapaženo.
 */
export const KATEGORIJA_TIP = {
  /* ------------------------------ gsmexpert.rs ----------------------------- */
  // Serviserski alat i potrošni materijal.
  "gsmexpert|alati-2|/brend-qianli-7": "delovi",
  "gsmexpert|alati-2|/brend-quick-8": "delovi",
  "gsmexpert|alati-2|/brend-relife-9": "delovi",
  "gsmexpert|alati-2|/brend-sunshine-10": "delovi",
  "gsmexpert|alati-2|/duple-trake-11": "delovi",
  "gsmexpert|alati-2|/flux-tecnosti-12": "delovi",
  "gsmexpert|alati-2|/ostalo-13": "delovi",

  "gsmexpert|baterije-227|/aplong-228": "baterije",
  "gsmexpert|baterije-227|/deji-230": "baterije",
  "gsmexpert|baterije-227|/repart-262": "baterije",

  // „Elektronika" je zbirka rezervnih delova; touch screen je ipak ekran.
  "gsmexpert|elektronika-3|/touch-screen-5": "ekrani",
  "gsmexpert|elektronika-3|/backlight-14": "delovi",
  "gsmexpert|elektronika-3|/flet-kablovi-i-konektori-15": "delovi",
  "gsmexpert|elektronika-3|/frame-iphone-16": "delovi",
  "gsmexpert|elektronika-3|/jc-252": "delovi",
  "gsmexpert|elektronika-3|/kamere-241": "delovi",
  "gsmexpert|elektronika-3|/polarizator-18": "delovi",
  "gsmexpert|elektronika-3|/poklopci-17": "delovi",
  "gsmexpert|elektronika-3|/stakla-za-reparaciju-19": "delovi",
  "gsmexpert|elektronika-3|/zvucnici-21": "delovi",

  // Svi LCD podbrendovi su ekrani, bez izuzetka.
  "gsmexpert|lcd-4|*": "ekrani",

  "gsmexpert|punjaci-231|/punjaci-231": "punjaci",

  "gsmexpert|service-pack-original-46|/baterije-service-pack-50": "baterije",
  "gsmexpert|service-pack-original-46|/lcd-service-pack-51": "ekrani",
  "gsmexpert|service-pack-original-46|/poklopci-service-pack-52": "delovi",
  "gsmexpert|service-pack-original-46|/punjaci-service-pack-246": "punjaci",
  "gsmexpert|service-pack-original-46|/elektronika-sh-269": "delovi",
  "gsmexpert|service-pack-original-46|/telefoni-refabrikovani-271": "telefoni",

  /* ------------------------------ vipmobil.net ----------------------------- */
  "vipmobil|/sr/category/mobilni-i-fiksni-telefoni": "telefoni",
  "vipmobil|/sr/category/lcd-touchscreen": "ekrani",
  "vipmobil|/sr/category/pametni-satovi": "satovi",
  "vipmobil|/sr/category/memorije/memorijske-kartice": "memorije",

  "vipmobil|/sr/category/oprema-za-mobilni/baterije": "baterije",
  "vipmobil|/sr/category/oprema-za-mobilni/punjaci": "punjaci",
  "vipmobil|/sr/category/oprema-za-mobilni/futrole": "maske",
  "vipmobil|/sr/category/oprema-za-mobilni/zastitna-stakla": "stakla",
  "vipmobil|/sr/category/oprema-za-mobilni/zastita-za-kameru": "stakla",
  "vipmobil|/sr/category/oprema-za-mobilni/nalepnice-za-mobilni-telefon": "stakla",
  "vipmobil|/sr/category/oprema-za-mobilni/usb-data-cable": "kablovi",
  "vipmobil|/sr/category/oprema-za-mobilni/audio-adapteri": "audio",
  "vipmobil|/sr/category/oprema-za-mobilni/bluetooth-zvucnici": "audio",
  "vipmobil|/sr/category/oprema-za-mobilni/slusalice-i-zvucnici": "audio",
  "vipmobil|/sr/category/oprema-za-mobilni/power-bank": "powerbank",
  "vipmobil|/sr/category/oprema-za-mobilni/drzaci-holderi": "powerbank",
  "vipmobil|/sr/category/oprema-za-mobilni/kucista": "delovi",
  "vipmobil|/sr/category/oprema-za-mobilni/tastature-za-mobilne-telefone": "delovi",
  "vipmobil|/sr/category/oprema-za-mobilni/serviserska-oprema": "delovi",
  "vipmobil|/sr/category/oprema-za-mobilni/olovke": "ostalo",
  "vipmobil|/sr/category/oprema-za-mobilni/kanapi-privesci": "ostalo",
  "vipmobil|/sr/category/oprema-za-mobilni/sim-adapteri": "ostalo",

  /* -------------------------------- gsm3g.com ------------------------------ */
  /* Ključ je "<Level1>|<Level2>" iz njihovog kataloga. Level1 sam ne govori
     dovoljno — "OPREMA ZA MOBILNI TELEFON I TABLET" drži i maske i stakla i
     punjače i kablove, pa se klasifikuje po Level2. */

  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|MASKE ZA MOBILNE TELEFONE I TABLETE": "maske",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|NOVCANICI I TORBE": "maske",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|VODOOTPORNE TORBICE": "maske",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|BUMPERI": "maske",

  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|ZAŠTITNA STAKLA I FOLIJE": "stakla",

  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|PUNJAČI": "punjaci",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|DATA KABLOVI": "kablovi",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|ADAPTERI": "kablovi",

  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|SLUŠALICE": "audio",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|ZVUČNICI I MIKROFONI": "audio",

  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|BACK UP BATERIJE/POWER BANK": "powerbank",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|STALCI I NOSACI": "powerbank",

  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|PRIVESCI": "ostalo",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|TRAKE PRIVESCI I NALEPNICE": "ostalo",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|OLOVKE ZA TOUCH SCREEN": "ostalo",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|RUKAVICE ZA TOUCH SCREEN": "ostalo",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|OBJEKTIVI": "ostalo",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|OSTALO": "ostalo",

  // Zbirna kategorija — unutar nje ima i ekrana i baterija, pa je razdvaja
  // `TIP_PO_NAZIVU` ispod.
  "gsm3g|REZERVNI DELOVI|REZERVNI DELOVI ZA MOBILNE TELEFONE/ELEKTRONIKA": "delovi",
  "gsm3g|REZERVNI DELOVI|BATERIJE": "baterije",

  // Serviserski alat i potrošni materijal — Mobil Plus LA je servis, pa ovo
  // ostaje u ponudi (prodaje se i majstorima).
  "gsm3g|ALATI|RUCNI ALATI": "delovi",
  "gsm3g|ALATI|HEMIKALIJE I MATERIJALI": "delovi",
  "gsm3g|ALATI|DUVALJKE I LEMILICE": "delovi",
  "gsm3g|ALATI|ALATI ZA REPARACIJU": "delovi",
  "gsm3g|ALATI|MERNA OPREMA": "delovi",
  "gsm3g|ALATI|RADNI PROSTOR": "delovi",
  "gsm3g|ALATI|OPREMA ZA PROGRAMIRANJE": "delovi",
  "gsm3g|ALATI|MIKROSKOPI I KAMERE": "delovi",
  "gsm3g|ALATI|STEGE I DRZACI": "delovi",
  "gsm3g|ALATI|GREJACI I GREJNE PLOCE": "delovi",
  "gsm3g|ALATI|UV LAMPE  DUST LED": "delovi",
  "gsm3g|ALATI|SISTEMI ZA IZVLACENJE ISPARENJA  CLEANROOM I ESD": "delovi",
  "gsm3g|ALATI|ULTRAZVUCNE KADE": "delovi",
  "gsm3g|ALATI|ALATI ZA PUNKTOVANJE I ZAVARIVANJE": "delovi",
  "gsm3g|ALATI|LASERI": "delovi",
  "gsm3g|ALATI|AKU ALATI": "delovi",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|MAŠINE I STAMPACI ZA FOLIJE": "delovi",

  "gsm3g|SMART OPREMA|SMART SATOVI": "satovi",

  "gsm3g|MOBILNI TELEFONI I TABLETI|MOBILNI TELEFONI": "telefoni",
  "gsm3g|MOBILNI TELEFONI I TABLETI|TABLETI": "telefoni",
};

/* ----------------------------- Šta se izbacuje ---------------------------- */

/**
 * Kategorije izvora koje NE ulaze u katalog. Vlasnik je tražio samo ono što je
 * vezano za mobilne telefone, a dobavljači prodaju i mnogo šire.
 *
 * Ključ je istog oblika kao u `KATEGORIJA_TIP`.
 */
export const PRESKOCI = new Set([
  // Delovi za laptopove i računare — drugi posao, i vukli bi laptop LCD-ove
  // u kategoriju „Ekrani i LCD" gde kupac traži ekran za telefon.
  "gsm3g|REZERVNI DELOVI|REZERVNI DELOVI ZA RACUNARE I LAPTOPOVE",
  // „Smart oprema" koja nije oprema za telefon.
  "gsm3g|SMART OPREMA|ELEKTRICNI TROTINETI",
  "gsm3g|SMART OPREMA|ELEKTRICNE BICIKLE",
  "gsm3g|SMART OPREMA|AKCIONE KAMERE",
  "gsm3g|SMART OPREMA|SMART HOME",
  "gsm3g|SMART OPREMA|SMART KAMERE",
  "gsm3g|SMART OPREMA|PREČIŠĆIVACI VAZDUHA",
  "gsm3g|SMART OPREMA|SMART TV BOX",
  "gsm3g|SMART OPREMA|PROJEKTORI",
  "gsm3g|SMART OPREMA|SMART NAOČARE",
  "gsm3g|SMART OPREMA|OSTALO",
  "gsm3g|OPREMA ZA MOBILNI TELEFON I TABLET|MP4 PLAYERI",
  // Makete su prazni modeli za izlog, ne prodaju se kupcu.
  "gsm3g|MOBILNI TELEFONI I TABLETI|MAKETE",
]);

/* ------------------------- Preciziranje po nazivu ------------------------- */

/**
 * Dobavljači ponekad drže ekrane, baterije i punjače u jednoj zbirnoj
 * kategoriji „rezervni delovi". Kad kategorija da generički `delovi`, naziv
 * artikla je pouzdaniji — ova pravila se primenjuju SAMO na `delovi`, pa ne
 * mogu da pokvare tačno klasifikovan artikal.
 *
 * Redosled je bitan: prvi pogodak pobeđuje.
 */
export const TIP_PO_NAZIVU = [
  // „LCD za iPhone 15 + touch screen" — kod GSM 3G ovih ima preko 800 u zbirnoj
  // kategoriji „rezervni delovi", pa bi bez ovog pravila završili van „Ekrana".
  { tip: "ekrani", match: /\b(lcd|oled|displej|display|ekran)\b|touch\s?screen/ },
  { tip: "baterije", match: /^baterija\b|\bbaterija za\b/ },
  { tip: "punjaci", match: /\bpunjac\w*\b|\bcharger\b/ },
  { tip: "kablovi", match: /\bkabl\w*\b|\bkabel\b/ },
];


/* --------------------------------- Brendovi -------------------------------- */

/**
 * Brend telefona ZA KOJI artikal odgovara (ne proizvođač same opreme —
 * kupac traži „staklo za Samsung", a ne „staklo marke Nillkin").
 *
 * Redosled je bitan: prvi pogodak pobeđuje, pa specifičniji obrasci idu prvi.
 * Obrasci se testiraju nad normalizovanim nazivom (mala slova, bez dijakritike).
 */
export const BRENDOVI = [
  { key: "apple", label: "Apple / iPhone", match: [/\biphone\b/, /\bipad\b/, /\bairpods\b/, /\bapple\b/, /\bip(?:1[0-9]|[6-9])\b/] },
  // Samsung: marketinški nazivi + fabričke SM- oznake (SM-S911B, A135F, N105).
  { key: "samsung", label: "Samsung", match: [/\bsamsung\b/, /\bgalaxy\b/, /\bsm-[a-z]?\d/, /\bnote\s?\d{1,2}\b(?!.*redmi)/] },
  { key: "xiaomi", label: "Xiaomi / Redmi / Poco", match: [/\bxiaomi\b/, /\bredmi\b/, /\bpoco\b/, /\bmi\s?\d/, /\bnarzo\b/] },
  { key: "honor", label: "Honor", match: [/\bhonor\b/] },
  { key: "huawei", label: "Huawei", match: [/\bhuawei\b/, /\bmate\s?\d/, /\bp\s?smart\b/, /\bnova\s?\d/] },
  { key: "nokia", label: "Nokia", match: [/\bnokia\b/, /\bn1[0-9]{2}\b/] },
  { key: "motorola", label: "Motorola", match: [/\bmotorola\b/, /\bmoto\s?[ge]\b/, /\bmoto\s?g\d/] },
  { key: "oppo", label: "Oppo", match: [/\boppo\b/] },
  { key: "realme", label: "Realme", match: [/\brealme\b/] },
  { key: "vivo", label: "Vivo", match: [/\bvivo\b/] },
  { key: "oneplus", label: "OnePlus", match: [/\boneplus\b/, /\bone\s?plus\b/] },
  { key: "google", label: "Google Pixel", match: [/\bgoogle\b/, /\bpixel\b/] },
  { key: "zte", label: "ZTE", match: [/\bzte\b/, /\bblade\b/] },
  { key: "tecno", label: "Tecno", match: [/\btecno\b/] },
  { key: "infinix", label: "Infinix", match: [/\binfinix\b/] },
  { key: "alcatel", label: "Alcatel / TCL", match: [/\balcatel\b/, /\btcl\b/] },
  { key: "sony", label: "Sony", match: [/\bsony\b/, /\bxperia\b/] },
  { key: "lg", label: "LG", match: [/\blg\b/] },
  { key: "asus", label: "Asus", match: [/\basus\b/, /\bzenfone\b/] },
  { key: "lenovo", label: "Lenovo", match: [/\blenovo\b/] },
  { key: "ipro", label: "iPro", match: [/\bipro\b/] },
  { key: "gigaset", label: "Gigaset", match: [/\bgigaset\b/] },
  { key: "panasonic", label: "Panasonic", match: [/\bpanasonic\b/] },
];

/** Artikal bez prepoznatog brenda — alat, kablovi, univerzalna oprema. */
export const BREND_UNIVERZALNO = { key: "univerzalno", label: "Univerzalno" };

/* ---------------------------------- Model ---------------------------------- */

/**
 * Izvlačenje modela telefona iz naziva. Namerno KONZERVATIVNO: model se
 * prikazuje kupcu („Odgovara modelu iPhone 15 Pro"), pa je bolje ostaviti
 * prazno nego napisati pogrešno.
 *
 * Model se uzima SAMO kad je u nazivu prepoznat brend telefona, i to počevši
 * od same brend-reči. Bez tog uslova obrazac „za <nešto sa cifrom>" hvata i
 * nazive alata — „Aktivator za bateriju SUNSHINE SS-905F" davao je model
 * „bateriju SUNSHINE SS-905F", a „pistolj za lepljenje RL-062B" model
 * „lepljenje RL-062B".
 *
 * Dva obrasca, oba vezana za brend:
 *  1. model u zagradi — „for SM-F776B (Galaxy Z Flip 8)" → „Galaxy Z Flip 8"
 *  2. od brend-reči do prvog razdvajača — „Baterija Samsung S20 Ultra/ G988F
 *     (GH82-22272A)" → „Samsung S20 Ultra"
 */
export const MODEL_U_ZAGRADI =
  /\(((?:galaxy|iphone|redmi|poco|honor|huawei|mate|nokia|moto|xperia|pixel)[^)]{1,40})\)/i;

/** Razdvajači na kojima se model završava kod obrasca vezanog za brend. */
export const MODEL_KRAJ = /[\/(+]|\s[-–—]\s|\s\+/;

/**
 * Reči koje smeju da stoje ODMAH ispred modela a da se ne računaju u njega —
 * tako „LCD za Samsung A21S" i „Baterija Samsung S20" daju isti oblik modela.
 */
export const MODEL_PREFIKSI = /^(?:za|for)\s+/i;

/** Reči koje nisu deo modela — čiste se sa krajeva izvučenog modela. */
export const MODEL_SMECE = [
  "touch screen", "touchscreen", "+ touch", "crni", "crna", "beli", "bela",
  "zlatna", "plavi", "plava", "zeleni", "zelena", "rozi", "roza", "sivi", "siva",
  "org", "full org", "f-org", "sp", "china", "incell", "oled", "service pack",
  "sa okvirom", "bez okvira", "with frame", "black", "white", "blue", "green",
  "gold", "silver", "red", "clear", "strong", "magsafe",
];

/* ------------------------------ Zaštita cena ------------------------------- */

/**
 * Gornja granica za nabavnu cenu u evrima.
 *
 * Na vipmobil-u deo artikala ima cenu unetu u DINARIMA u polju označenom kao
 * EUR (npr. „Xiaomi Redmi A3 … 8 990.00 €" — to je 8.990 RSD, ne 8.990 €).
 * Bez ovog zaštitnika, formula bi na tom artiklu dala cenu od nekoliko miliona
 * dinara. Zato artikli iznad granice NE dobijaju cenu — idu kao „Cena na upit"
 * i upisuju se u `data/cene-za-proveru.json` da ih vlasnik pregleda.
 *
 * Granica je 400 € jer i najskuplji telefoni u ovoj ponudi (iPhone, Galaxy S
 * serija) staju ispod toga po veleprodajnoj ceni.
 */
export const SUMNJIVA_CENA_EUR = 400;

/**
 * Ista zaštita za izvore koji cene daju u DINARIMA (gsmexpert, gsm3g).
 *
 * Prag je namerno mnogo viši nego kod evra: greška „uneo dinare u EUR polje"
 * kod dinarskog izvora ne postoji, pa ovde hvatamo samo stvarno besmislene
 * vrednosti. Sa pragom po evrima ispadali bi legitimno skupi artikli —
 * ekrani za Galaxy Z Fold (~50.000 RSD), mikroskopi i duvaljke za servis —
 * i završavali kao „Cena na upit" iako im je cena tačna.
 */
export const SUMNJIVA_CENA_RSD = 200000;

/* --------------------------------- Izvori ---------------------------------- */

export const IZVORI = {
  gsmexpert: { label: "GSM Expert", valuta: "RSD" },
  vipmobil: { label: "Vip mobil", valuta: "EUR" },
  gsm3g: { label: "GSM 3G", valuta: "EUR" },
};
