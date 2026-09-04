import { SajtJsonLd } from "@/components/SajtJsonLd";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { IstaknutiProizvodi } from "@/components/sections/IstaknutiProizvodi";
import { Kategorije } from "@/components/sections/Kategorije";
import { KontaktCTA } from "@/components/sections/KontaktCTA";
import { UslugeServisa } from "@/components/sections/UslugeServisa";
import { ZastoMi } from "@/components/sections/ZastoMi";

/**
 * Početna strana.
 *
 * Redosled prati put kupca: šta radimo (servis, po čemu nas ljudi i traže) →
 * šta imamo (kategorije pa izlog sa cenama) → zašto kod nas → česta pitanja →
 * kontakt. Servis je pre prodavnice namerno: većina poseta dolazi sa pretrage
 * „servis mobilnih telefona Novi Sad", a oprema se kupuje uz popravku.
 *
 * Strana je u celini server-renderovana i statična — jedini JS koji odlazi u
 * pretraživač su `Reveal` animacije i lebdeći kontakt iz layout-a.
 *
 * Metapodaci nisu ovde: podrazumevani `title`/`description`/`canonical` iz
 * `app/layout.tsx` pisani su baš za početnu, pa bi ih ovde samo ponovili.
 */
export default function HomePage() {
  return (
    <>
      {/* WebSite + pretraga prodavnice — samo ovde, vidi SajtJsonLd. */}
      <SajtJsonLd />
      <Hero />
      <UslugeServisa />
      <Kategorije />
      <IstaknutiProizvodi />
      <ZastoMi />
      {/*
        FAQPage strukturirane podatke prijavljuje `/servis` — Google traži da isti
        FAQ prijavi samo jedna strana, a tamo su ta pitanja i tematski kod kuće.
        Ovde ostaje samo vidljivi blok (odgovori su i dalje u HTML-u).
      */}
      <Faq jsonLd={false} />
      <KontaktCTA />
    </>
  );
}
