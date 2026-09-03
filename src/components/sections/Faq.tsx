import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { faq } from "@/lib/data";

/**
 * Česta pitanja na početnoj.
 *
 * Pitanja i odgovori dolaze iz `faq` (lib/data) — isti tekst nosi i `/servis`,
 * pa se odgovor na sajtu ne može raziđi na dva mesta.
 */

/**
 * FAQPage strukturirani podaci.
 *
 * Google traži da isti FAQ prijavi SAMO jedna strana; ako se pojavi na dve, oba
 * bloka može da ignoriše. Zato je prijavljivanje pod prekidačem — strana koja je
 * jedini izvor ovog FAQ-a ga uključuje, ostale ga gase (vidi `src/app/page.tsx`).
 */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export function Faq({ jsonLd = true }: { jsonLd?: boolean }) {
  return (
    <section className="section border-t border-ink-600">
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}

      <div className="container">
        <SectionHeading
          align="center"
          eyebrow="Česta pitanja"
          title="Pitanja koja najčešće dobijamo"
          description="Ako odgovora nema ovde, pitajte na Viber ili WhatsApp — odgovaramo u toku radnog vremena."
        />

        <div className="mx-auto mt-12 max-w-3xl space-y-3">
          {faq.map((f) => (
            /*
              <details> namerno umesto akordeona u React-u: otvaranje pitanja ne
              zahteva ni bajt JavaScript-a, radi i pre hidratacije, a odgovori su
              u HTML-u — dakle vidljivi i pretraživaču.
            */
            <details
              key={f.q}
              className="group rounded-2xl border border-ink-600 bg-ink-800 px-5 py-4 shadow-card transition-colors open:border-brand/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-cream [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown
                  aria-hidden
                  className="h-4 w-4 shrink-0 text-brand-400 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-cream/70">{f.a}</p>
            </details>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-10 text-center">
          <Button asChild variant="outline">
            <Link href="/servis">
              Sve o servisu, rokovima i delovima
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
