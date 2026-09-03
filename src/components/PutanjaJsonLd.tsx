const SITE_URL = "https://mobilplusla.rs";

/**
 * BreadcrumbList strukturirani podaci. Google ih koristi da u rezultatu umesto
 * golog URL-a prikaže putanju (Početna › Zaštitna stakla › Staklo za iPhone 15),
 * što primetno podiže broj klikova.
 *
 * Ide na svaku stranicu koja je dublja od početne — kategorije, brendove,
 * kataloške strane i pojedinačne artikle. „Početna" se dodaje sama, pa se
 * u `stavke` šalje samo ostatak putanje.
 */
export function PutanjaJsonLd({
  stavke,
}: {
  stavke: Array<{ naziv: string; href: string }>;
}) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Početna", item: SITE_URL },
      ...stavke.map((s, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: s.naziv,
        item: `${SITE_URL}${s.href}`,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
