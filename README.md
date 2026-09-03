# Mobil Plus LA — sajt servisa i prodavnice

Sajt za **Mobil Plus LA** (servis mobilnih telefona i prodaja opreme, Braće Ribnikar 17, Novi Sad).
Dva posla, jedan sajt: **servis** (zamena ekrana i baterija, skidanje Google naloga, spašavanje
podataka) i **prodavnica** opreme (maske, zaštitna stakla, punjači, kablovi, baterije, ekrani).

Sajt je **katalog, ne veb-šop**. Nema korpe, checkout-a ni forme za narudžbinu — svaki artikal
prikazuje cenu, a ispod cene dugmad za **Viber, WhatsApp, Instagram i telefon** sa unaprijed
popunjenom porukom o tom artiklu. Tako je vlasnik i naručivao do sada, pa se ništa ne menja.

---

## Pokretanje (lokalno)

Potreban je **Node.js 18.18+** (preporuka: Node 20+).

```bash
npm install
npm run dev
```

Otvori **http://localhost:3000**.

| Komanda | Šta radi |
| --- | --- |
| `npm run dev` | razvojni server |
| `npm run build` | produkcijski build |
| `npm run start` | pokretanje produkcijskog builda |
| `npm run lint` | provera koda |
| `npm run gsm3g` | preuzimanje kataloga sa GSM 3G (vidi niže) |
| `npm run katalog` | ponovno generisanje kataloga proizvoda (vidi niže) |

---

## Tehnologija

- **Next.js 14** (App Router) + **TypeScript strict**
- **Tailwind CSS** — dark-first dizajn sistem, tokeni u `tailwind.config.ts`
  (`ink`, `brand`, `accent`, `cream`, `muted`, `border`, `shadow-*`)
- **Framer Motion** — reveal-on-scroll i suptilne animacije
- **lucide-react** — ikonice
- UI komponente su ručno pisane u `src/components/ui` — bez eksternih zavisnosti i API ključeva

Sajt radi bez servisa u pozadini: nema baze, nema API ključeva, nema forme koja šalje mejl.
Sve što treba za render je u repozitorijumu.

---

## Struktura projekta

```
src/
├── app/
│   ├── layout.tsx              # fontovi, SEO meta, LocalBusiness JSON-LD, Header/Footer
│   ├── page.tsx                # POČETNA
│   ├── prodavnica/             # katalog sa filterima (fasete u URL-u, filtriranje na serveru)
│   ├── servis/                 # usluge servisa
│   ├── kategorija/[tip]/       # SEO stranice po vrsti artikla (maske, stakla, baterije…)
│   ├── za-telefon/[brend]/     # SEO stranice po brendu telefona (Apple, Samsung, Xiaomi…)
│   ├── katalog/[strana]/       # kataloški indeks — interni linkovi ka svakom artiklu
│   ├── proizvod/[slug]/        # stranica artikla: cena + načini kontakta
│   ├── o-nama/, kontakt/
│   └── sitemap.ts, robots.ts, image-sitemap.xml/route.ts, not-found.tsx
├── components/
│   ├── Cena.tsx                # prikaz cene ili „Cena na upit"
│   ├── KontaktDugmad.tsx       # Viber / WhatsApp / Instagram / telefon, sa porukom o artiklu
│   ├── ProizvodKartica.tsx     # kartica u katalogu (slika, naziv, cena, kontakt)
│   ├── ProductThumb.tsx        # slika artikla + brendiran placeholder kad slike nema
│   ├── PutanjaJsonLd.tsx       # BreadcrumbList strukturirani podaci
│   ├── layout/                 # Header, Footer
│   └── ui/                     # Button, Card, Badge, Input, MultiSelect, SectionHeading…
├── lib/
│   ├── site.ts                 # KONTAKT PODACI — jedan izvor istine
│   ├── data.ts                 # kategorije, usluge servisa, prednosti, FAQ
│   ├── products.ts             # serverski model kataloga (uvlači ceo products.json)
│   ├── shop-query.ts           # serversko filtriranje/sortiranje/paginacija
│   ├── catalog.ts              # klijent-safe: fasete, slugovi, cenovni razredi, linkovi
│   ├── pricing.ts              # formatiranje cene (`formatRsd`)
│   └── utils.ts                # cn()
├── data/products.json          # GENERISANO — ne menja se ručno
scripts/
├── build-catalog.mjs           # gradi products.json iz veleprodajnih kataloga
├── pricing.mjs                 # FORMULA ZA CENU (marža + kurs)
└── telefoni-dictionary.mjs     # mapiranje tuđih kategorija/brendova/modela na naše
data/                           # sirovi ulaz scrapera (nije u git-u)
```

---

## Gde se menjaju podaci

### Kontakt, adresa, radno vreme, mreže → `src/lib/site.ts`

**Jedini izvor istine.** Telefon (`061 119 3567`), dodatni broj, mejl, adresa, radno vreme,
Instagram, koordinate za mapu — sve na jednom mestu. Promena ovde se odražava na celom sajtu:
zaglavlje, futer, Viber/WhatsApp dugmad, JSON-LD za Google.

Nigde u komponentama nema hardkodovanog telefona. Ako ti negde treba broj ili predpopunjena
poruka, uzmi ih odatle:

```ts
import { site, inquiryFor } from "@/lib/site";

site.telHref                          // tel:+381611193567
site.whatsappHref("Zdravo, …")        // wa.me link sa porukom
site.viberHref(inquiryFor(naziv, cena))
```

### Kategorije, usluge servisa, prednosti, FAQ → `src/lib/data.ts`

Tekstovi usluga su prepisani sa zvaničnog flajera firme, ne izmišljeni. Sam flajer se **ne
prikazuje** na sajtu — poslat je kao izvor podataka i smera dizajna, pa je njegov sadržaj
ugrađen kao tekst i UI (vidi `OpremaUzServis` na `/servis` i `VizitKarta` na `/o-nama`).
Od slika u `public/images/brend/` koristi se samo `logo.jpg`. Ključevi kategorija
(`maske`, `stakla`, `baterije`…) **moraju** da odgovaraju `TIPOVI` iz
`scripts/telefoni-dictionary.mjs` — po njima se filtrira katalog.

---

## Katalog proizvoda

### Odakle dolaze podaci

Katalog se ne unosi ručno. Gradi se iz **veleprodajnih kataloga dobavljača** kojima vlasnik
ima pristup preko svog naloga (cene bez PDV-a vidi samo prijavljen partner):

| Izvor | Valuta | Artikala | Ulazni fajl | Kako se osvežava |
| --- | --- | ---: | --- | --- |
| **gsm3g.com** | RSD | 21.418 | `data/gsm3g-harvest.json` | `npm run gsm3g` — automatski |
| **vipmobil.net** | EUR | 12.480 | `data/vipmobil-harvest.json` | ručno, iz prijavljenog pretraživača |
| **gsmexpert.rs** | RSD | 2.023 | `data/gsmexpert-harvest.json` | ručno, iz prijavljenog pretraživača |

**Zašto se dva izvora osvežavaju ručno.** GSM 3G proizvode servira sa zasebnog OData
servisa koji kupca prepoznaje po `userUid`-u u adresi, a ne po kolačiću sesije — zato
`npm run gsm3g` radi iz komandne linije, bez pretraživača. GSM Expert i Vip mobil cene
prikazuju samo prijavljenoj sesiji (neprijavljenom posetiocu Vip mobil vraća `0.00 €`),
pa se njihovi harvest fajlovi za sada prave iz otvorenog, prijavljenog pretraživača.

Iz kataloga se **izbacuje sve što nije vezano za mobilne telefone** — GSM 3G prodaje i
računare, auto opremu, rasvetu i sport. Spisak izbačenih kategorija je `PRESKOCI` u
`scripts/telefoni-dictionary.mjs` (trenutno 1.270 artikala, uključujući delove za
laptopove i električne trotinete).

Harvest fajlovi su sirovi ispis njihovih kataloga (`{ "kategorija": [[id, naziv, cena, slika], …] }`).
Direktorijum `data/` je **izvan git-a** — to su tuđe nabavne cene i nemaju šta da rade u
javnom repozitorijumu. Za build sajta nisu potrebni; potreban je samo generisani
`src/data/products.json`.

Isti artikal često postoji kod dva dobavljača. Skripta ga tada spaja u jedan unos i zadržava
**jeftiniju nabavnu cenu**, jer se po njoj i formira naša.

### Osvežavanje kataloga

```bash
npm run katalog
```

Skripta pročita harvest fajlove, klasifikuje artikle, izračuna prodajne cene i upiše
`src/data/products.json`. Na kraju ispiše izveštaj — koliko artikala po izvoru i vrsti,
koliko ih je bez cene, koliko je prepoznatih modela telefona.

Kad dobavljač promeni katalog, prvo se osveži odgovarajući harvest fajl, pa se pokrene
`npm run katalog`. Generisani `products.json` se **ne menja ručno** — svaka izmena u njemu
se briše prvim sledećim pokretanjem.

### Formula za cenu → `scripts/pricing.mjs`

Jedino mesto gde se prodajna cena formira. Marža je stepenasta (na sitnijoj robi veći
množilac), a kurs se menja ručno:

```js
export const EUR_RSD = 117.5;   // ZAMENI kad se kurs bitno promeni

// do 1,50 €    → ×6
// 1,50 – 2,50 € → ×4
// 2,50 – 3,00 € → ×3
// preko 3,00 €  → ×2,5
```

Cene se **peku** u `products.json` u trenutku build-a kataloga, pa formula ne postoji u
runtime-u — `src/lib/pricing.ts` samo formatira broj (`formatRsd(2340)` → `"2.340 RSD"`).
Time nema dve kopije formule koje mogu da se raziđu. Posle svake izmene marže ili kursa
obavezno `npm run katalog`.

Sve cene se zaokružuju na najbližih 10 dinara — „2.340" izgleda kao cena, „2.337,64" izgleda
kao greška u tabeli.

### Mapiranje kategorija izvora → `scripts/telefoni-dictionary.mjs`

Tu se menja **sva** logika prevođenja tuđih kategorija i naziva u naš katalog:

| Šta | Gde u rečniku |
| --- | --- |
| naše vrste artikala i njihovi nazivi | `TIPOVI` |
| kategorija izvora → naša vrsta | `KATEGORIJA_TIP` (ključ: `"<izvor>\|<grupa>\|<podgrupa>"`) |
| brendovi telefona i njihovi obrasci | `BRENDOVI` |
| izvlačenje modela iz naziva | `MODEL_U_ZAGRADI`, `MODEL_KRAJ`, `MODEL_SMECE` |
| gornja granica nabavne cene | `SUMNJIVA_CENA_EUR` |

Princip: **kategorija izvora je autoritet za vrstu artikla**, a naziv se koristi samo za brend
i model. Kategorije su kod njih uredne, nazivi nisu („TPU CLEAR STRONG for SM-F776B").

Ključ podržava i `*` na nivou grupe (`"gsmexpert|maske-4|*"`), pa nova podgrupa ne mora ručno
da se dodaje ako cela grupa ide u istu vrstu.

**Kad dobavljač otvori novu kategoriju**, ona nema mapiranje i skripta na kraju ispiše
upozorenje, a spisak upiše u `data/neklasifikovano.json`. Dodaj te ključeve u
`KATEGORIJA_TIP` i pokreni `npm run katalog` ponovo. Do tada takvi artikli privremeno idu u
`delovi`, da ne ispadnu iz kataloga.

### Šta znači `data/cene-za-proveru.json`

Spisak artikala kojima **nije dodeljena cena** jer im je nabavna cena na izvoru sumnjiva.

Na vipmobil-u deo artikala ima cenu unetu u dinarima u polju označenom kao EUR (npr.
„8 990.00 €" gde je stvarno 8.990 RSD). Bez zaštite, formula bi na takvom artiklu dala cenu od
nekoliko miliona dinara i to bi otišlo na sajt. Zato svaki artikal sa nabavnom cenom **iznad
400 €** (`SUMNJIVA_CENA_EUR`) ostaje bez cene, na sajtu se prikazuje kao **„Cena na upit"**, a
upisuje se u ovaj fajl.

Fajl je radna lista za vlasnika: prođi kroz njega, proveri prave cene kod dobavljača i, ako je
cena stvarno tolika, podigni granicu ili unesi cenu ručno u izvor. Prazan fajl (`[]`) znači da
nema ništa za proveru.

### Slike artikala

Fotografije **ostaju na serverima dobavljača** — katalog čuva pune adrese, ne lokalne kopije.
Hostovi su dozvoljeni u `next.config.mjs` (`remotePatterns`).

#### Veličine → `src/lib/slike.ts`

Adrese u katalogu pokazuju na **sličice** koje dobavljači koriste u svojim listama, a te su
premale za naše kartice i vide se kao mutne. Svaki izvor ima veću varijantu, ali na drugačiji
način, pa `slikaZa(src, kadar)` prepisuje adresu:

| Izvor | U katalogu | Kartica | Stranica artikla | Kako |
| --- | --- | --- | --- | --- |
| gsmexpert.rs | 120×120 | **500×500** | **800×800** | `w`/`h` u timthumb query stringu |
| gsm3g.com | 270×270 | **1000×1000** | 1000×1000 | sufiks `_w270` → `_w1000` |
| vipmobil.net | 300×300 | 300×300 | **original 3264×3264** | prefiks `rs_` se skida |

Vip mobil **nema srednju veličinu** — ili 300 px ili original od 1,1 MB. Zato original ide samo
na stranicu artikla i to kroz Next optimizator (`trebaOptimizaciju`), koji ga smanji na ~8 kB.
U mreži od 24 kartice originali bi bili 27 MB po strani, pa tamo ostaje `rs_`.

Sve ostalo se servira `unoptimized`: slike su već male, a optimizacija 33.000+ artikala bi samo
trošila kvotu transformacija hostinga bez dobiti.

Slika sme da **fali** (`image` je opciono polje), a Vip mobil za deo artikala vraća svoj
`default_product.png` — što nije fotografija proizvoda. Oba slučaja hvata `ProductThumb` i
prikaže brendiran placeholder sa ikonicom kategorije, tako da kartica nikad nije prazna
(trenutno: 33.502 artikla sa pravom fotografijom, 2.067 bez slike, 332 sa tuđim placeholder-om).

Zbog toga `/image-sitemap.xml` **ne prijavljuje fotografije artikala** — Google indeksira sliku
pod domenom na kome se nalazi, a to su tuđi domeni. Sitemap sadrži samo slike sa našeg domena
(brend materijal iz `public/images/brend/`) i automatski će obuhvatiti fotografije artikala ako
ih ikad počnemo keširati lokalno. Detaljno objašnjenje je u komentaru u
`src/app/image-sitemap.xml/route.ts`.

---

## SEO — šta je podešeno

- `sitemap.xml` — početna, prodavnica, servis, o nama, kontakt, sve kategorije, sve stranice po
  brendu, sve kataloške strane i **svaki artikal**
- `robots.txt` — sve otvoreno, oba sitemap-a prijavljena
- **BreadcrumbList** (`PutanjaJsonLd`) na svakoj stranici dublje od početne
- **LocalBusiness / Store** JSON-LD u `layout.tsx` — naziv, adresa u Novom Sadu, telefon,
  radno vreme, koordinate
- Open Graph i Twitter kartice za deljenje na mrežama (`public/og.jpg`, 1200×630)
- Meta naslovi i opisi na srpskom, sa lokalnim ključnim rečima

**Zašto postoje `/kategorija/[tip]` i `/za-telefon/[brend]`:** prodavnica filtrira preko
URL parametara i prikazuje ograničen broj artikala po strani. Googlebot izvršava JS, ali ne
klikće dugmad, pa bez tih stranica i kataloškog indeksa hiljade artikala ne bi imale nijedan
interni link — što Google po pravilu ostavlja u „Discovered – currently not indexed".

Pre objave proveri da je domen `https://www.mobil-plus-la.com` tačan u `layout.tsx`, `sitemap.ts`,
`robots.ts`, `image-sitemap.xml/route.ts` i `PutanjaJsonLd.tsx`.

---

## Objava

Najlakše preko [Vercel](https://vercel.com): povežeš repozitorijum i sajt je online. Radi i na
svakom hostingu sa Node.js podrškom (`npm run build` + `npm run start`).

### Adresa sajta i indeksiranje

Apsolutne adrese (canonical, OG slike, sitemap, JSON-LD) dolaze iz `SITE_URL` u
`src/lib/site.ts`. Vrednost se bira ovim redom:

| # | Izvor | Kada se koristi |
| --- | --- | --- |
| 1 | `NEXT_PUBLIC_SITE_URL` | ručni override, ako ikad zatreba drugi domen |
| 2 | `VERCEL_PROJECT_PRODUCTION_URL` | na Vercel-u — automatski, to je povezani domen |
| 3 | `https://www.mobil-plus-la.com` | lokalni rad, van Vercel-a |

**Dok sajt stoji na `*.vercel.app`, `robots.txt` zabranjuje obilazak** (`Disallow: /`) —
vidi `NA_PRAVOM_DOMENU` u `src/lib/site.ts`. To je namerno: da Google ne zapamti privremenu
adresu i da kasnije pravi domen ne konkuriše sam sebi. Deljenje linka i dalje radi
normalno — zabrana važi samo za pretraživače.

Kad se `mobil-plus-la.com` poveže (Vercel → Settings → Domains), zabrana se sama skida
posle prvog sledećeg deploy-a — Vercel sam postavlja `VERCEL_PROJECT_PRODUCTION_URL` na
povezani domen, nema ručnog podešavanja env promenljive.

Drugih promenljivih nema: sajt ne šalje mejlove i ne zove eksterne servise.

---

© Mobil Plus LA — servis i oprema za mobilne telefone, Novi Sad.
