import { KontaktDugmad } from "@/components/KontaktDugmad";

/**
 * Prazan rezultat nije kraj razgovora: na sajtu je samo ono što je u
 * dobavljačkim katalozima, a u radnji stoji i više. Zato umesto „nema
 * rezultata" idu kontakt kanali. Deli je `/prodavnica` i kategorijske strane.
 */
export function PraznoStanje() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-ink-600 bg-ink-800/60 px-6 py-14 text-center">
      <h2 className="font-display text-xl font-bold text-cream md:text-2xl">
        Za ove filtere nemamo artikal u katalogu
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Ovde je samo ono što je trenutno u katalozima — asortiman u radnji je
        širi, a nove stvari stižu svake nedelje. Napišite nam koji telefon imate
        i šta vam treba, proverimo i kažemo cenu.
      </p>
      <KontaktDugmad className="mt-6 justify-center" />
    </div>
  );
}
