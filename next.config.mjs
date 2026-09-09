/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Fotografije artikala žive na veleprodajnim sajtovima — katalog čuva pune
    // adrese, ne lokalne kopije (vidi README, „Slike artikala"). Bez ovih hostova
    // svaka slika kroz `next/image` ruši render stranice.
    //
    // Spisak OSTAJE i posle prelaska na `/slika/[slug]`: ta ruta preuzima sliku
    // sa dobavljača serverski (`fetch`, ne `next/image`), ali `remotePatterns`
    // je jedina evidencija odakle slike smeju da dolaze i pukla bi svaka strana
    // koja se sutra vrati na direktnu adresu. Za samu `/slika/...` adresu ovde
    // nema šta da se doda — `next/image` sa putanjom koja počinje sa „/" tretira
    // sliku kao lokalnu i ne proverava je ni po kakvom spisku (`images.
    // localPatterns` postoji tek od Next-a 15).
    //
    // Upisana su oba oblika (sa i bez `www`): gsmexpert i vipmobil dobijaju
    // fiksni prefiks u `scripts/build-catalog.mjs`, ali gsm3g harvest nosi
    // apsolutne adrese onako kako stoje na njihovom sajtu.
    //
    // Raspodela u tekućem katalogu (35.901 artikal, 94% sa slikom):
    //   19.368  rstrigb2bee.blob.core.windows.net   ← GSM 3G drži slike na Azure
    //   12.479  www.vipmobil.net                       blob storage-u, NE na
    //    1.987  gsmexpert.rs                           gsm3g.com
    remotePatterns: [
      { protocol: "https", hostname: "gsmexpert.rs" },
      { protocol: "https", hostname: "www.gsmexpert.rs" },
      { protocol: "https", hostname: "vipmobil.net" },
      { protocol: "https", hostname: "www.vipmobil.net" },
      { protocol: "https", hostname: "gsm3g.com" },
      { protocol: "https", hostname: "www.gsm3g.com" },
      { protocol: "https", hostname: "rstrigb2bee.blob.core.windows.net" },
    ],
  },
};

export default nextConfig;
