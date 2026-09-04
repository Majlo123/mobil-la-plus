import type { Metadata, Viewport } from "next";
import { Sora, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { FloatingContact } from "@/components/FloatingContact";
import { ID_FIRME, site, SITE_URL } from "@/lib/site";

// Fontovi sa podrškom za srpsku latinicu (č, ć, š, ž, đ) → subset "latin-ext".
// Sora = samouveren grotesque za naslove; Manrope = vrhunska čitljivost u tekstu,
// a na crnoj podlozi njegovi mekši oblici manje "trepere" od geometrijskih.
const display = Sora({
  subsets: ["latin", "latin-ext"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});


// Zvanični logotip služi i kao OG slika: nemamo namensku 1200×630 grafiku, a
// kvadratni logo u pretraživanju/četu izgleda bolje od izrezanog kadra.
// ZAMENI kad se napravi namenska 1200×630 OG grafika.
const OG_IMAGE = "/images/brend/logo.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mobil Plus LA — Servis mobilnih telefona i oprema | Novi Sad",
    template: "%s | Mobil Plus LA",
  },
  description:
    "Servis mobilnih telefona u Novom Sadu: zamena ekrana i baterija, skidanje Google naloga, spašavanje podataka. Uz servis — maske, stakla, punjači i kablovi.",
  keywords: [
    "servis mobilnih telefona Novi Sad",
    "zamena ekrana",
    "zamena baterije",
    "popravka telefona",
    "skidanje Google naloga",
    "FRP",
    "spašavanje podataka",
    "maske za telefone",
    "zaštitno staklo",
    "folije za telefone",
    "punjači i kablovi",
    "auto punjač",
    "oprema za mobilne telefone",
    "Novi Sad",
    "Mobil Plus LA",
  ],
  authors: [{ name: site.name }],
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: SITE_URL,
    siteName: site.name,
    title: `${site.name} — servis i oprema za mobilne telefone, Novi Sad`,
    description:
      "Zamena ekrana i baterija, skidanje Google naloga i spašavanje podataka. Maske, zaštitna stakla, punjači i kablovi — Braće Ribnikar 17, Novi Sad.",
    images: [{ url: OG_IMAGE, width: 1100, height: 1100, alt: `${site.name} — ${site.slogan}` }],
  },
  twitter: {
    // "summary" (mali kvadrat) namerno: veliku karticu bi X izrezao na 1.91:1
    // i presekao krug logotipa.
    card: "summary",
    title: `${site.name} — servis i oprema za mobilne telefone`,
    description:
      "Servis mobilnih telefona u Novom Sadu — zamena ekrana i baterija, skidanje Google naloga, spašavanje podataka.",
    images: [OG_IMAGE],
  },
  robots: { index: true, follow: true },
  /**
   * Google Search Console — vlasništvo nad domenom je potvrđeno HTML fajlom iz
   * `public/` (`googlebf4d410f6fb7fd1e.html`). Meta oznaka je drugi, rezervni
   * način potvrde: ako se doda još jedna property (npr. apex domen bez `www`)
   * ili se fajl izgubi, dovoljno je postaviti
   * `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` na hostingu i uraditi novi deploy.
   * Dok promenljiva nije postavljena, oznaka se ne ispisuje.
   */
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export const viewport: Viewport = {
  // Boja adresne trake = ink (podloga sajta), da se mobilni browser stopi sa stranom.
  themeColor: "#05070A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/** Srpski nazivi dana u nedeljnom redu — potrebni za raspone iz `site.hours`. */
const NEDELJA = [
  { sr: "Ponedeljak", en: "Monday" },
  { sr: "Utorak", en: "Tuesday" },
  { sr: "Sreda", en: "Wednesday" },
  { sr: "Četvrtak", en: "Thursday" },
  { sr: "Petak", en: "Friday" },
  { sr: "Subota", en: "Saturday" },
  { sr: "Nedelja", en: "Sunday" },
];

/**
 * `site.hours` je pisan za ljude („Ponedeljak – Petak"), a schema.org traži
 * engleske nazive dana. Prevodimo ovde da radno vreme ostane na jednom mestu
 * i da se prikaz na sajtu i strukturirani podaci nikad ne raziđu.
 */
function daniIzOznake(oznaka: string): string[] {
  const granice = oznaka.split(/[–—-]/).map((d) => d.trim());
  const od = NEDELJA.findIndex((d) => d.sr === granice[0]);
  if (od === -1) return [];
  const doIndeksa = granice.length > 1 ? NEDELJA.findIndex((d) => d.sr === granice[1]) : od;
  if (doIndeksa === -1) return [NEDELJA[od].en];
  return NEDELJA.slice(od, doIndeksa + 1).map((d) => d.en);
}

const openingHoursSpecification = site.hours
  // Dan bez sati („Zatvoreno") se u schema.org izostavlja, ne šalje kao 00:00.
  .filter((h) => h.time.includes(":"))
  .map((h) => {
    const [opens, closes] = h.time.split(/[–—-]/).map((t) => t.trim());
    return {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: daniIzOznake(h.day),
      opens,
      closes,
    };
  })
  .filter((h) => h.dayOfWeek.length > 0);

// Structured data: MobilePhoneStore — najtačniji tip za radnju koja i prodaje
// opremu i servisira telefone (lokalni SEO + panel u Google pretrazi).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MobilePhoneStore",
  "@id": ID_FIRME,
  name: site.name,
  // Ljudi kucaju i „mobil plus" i „mobil plus novi sad".
  alternateName: ["Mobil Plus", "MOBIL PLUS LA", "Mobil Plus Novi Sad"],
  description: site.description,
  slogan: site.slogan,
  url: SITE_URL,
  telephone: site.phoneIntl,
  email: site.email,
  image: `${SITE_URL}${OG_IMAGE}`,
  logo: `${SITE_URL}/images/brend/logo.jpg`,
  // Servis + maloprodaja opreme — cenovni razred je niži deo skale.
  priceRange: "$",
  currenciesAccepted: "RSD",
  paymentAccepted: "Gotovina, platne kartice",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    postalCode: site.address.postalCode,
    addressRegion: site.address.region,
    addressCountry: "RS",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: site.address.lat,
    longitude: site.address.lng,
  },
  openingHoursSpecification,
  // Radnja radi za grad, ali telefone primamo i poštom iz cele Srbije.
  areaServed: [
    { "@type": "City", name: site.address.city },
    { "@type": "Country", name: site.address.country },
  ],
  sameAs: [site.socials.instagram],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Klasa "dark" je stalno prisutna: brend je dark-first, pa `dark:` varijante
    // u komponentama rade predvidljivo (tailwind.config koristi darkMode: class).
    <html lang="sr" className={`dark ${display.variable} ${sans.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        <main>{children}</main>
        <Footer />
        <FloatingContact />
      </body>
    </html>
  );
}
