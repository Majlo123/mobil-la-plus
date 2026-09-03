import Image from "next/image";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";

/**
 * Logo Mobil Plus LA — zvanični logotip klijenta (public/images/brend/logo.jpg).
 *
 * Logotip je kvadrat sa tekstom UNUTAR kruga; na 44px u headeru taj tekst se
 * slije u mrlju. Zato iz slike izrezujemo samo amblem (telefon + odvijač + plus)
 * a „MOBIL PLUS LA / NOVI SAD" slažemo tipografski — ostaje čitko na svakoj
 * veličini, a pretraživači i čitači ekrana ime firme vide kao pravi tekst.
 *
 * `full` (podrazumevano, header i futer) = amblem + wordmark.
 * `mark` = samo amblem, za uska mesta (mobilna traka, deljene kartice).
 *
 * Ceo znak je dimenzionisan u `em`, pa se skalira preko `text-*` klase:
 * `<Logo className="text-xl" />` uveća i amblem i tekst zajedno.
 */

export function Logo({
  variant = "full",
  className,
}: {
  variant?: "mark" | "full";
  className?: string;
}) {
  const jeFull = variant === "full";

  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-[0.7em] text-[1.05rem] leading-none",
        className,
      )}
    >
      <span className="relative block h-[2.4em] w-[2.4em] shrink-0 overflow-hidden rounded-full bg-ink ring-1 ring-brand/40">
        <Image
          src="/images/brend/logo.jpg"
          /* Kod `full` varijante ime firme već stoji kao tekst pored — slika bi
             ga čitačima ekrana ponovila, pa ide kao dekoracija. */
          alt={jeFull ? "" : site.name}
          aria-hidden={jeFull || undefined}
          width={1100}
          height={1100}
          sizes="128px"
          /* Kadriranje amblema: slika je dvostruko veća od okvira i podignuta
             tako da u krug uđe pojas oko telefona (mereno na 1100×1100 originalu
             — centar amblema je na ~35,5% visine, tekst ostaje ispod kadra). */
          className="absolute left-1/2 top-1/2 h-[200%] w-[200%] max-w-none -translate-x-1/2 -translate-y-[35.5%] object-cover"
        />
      </span>

      {jeFull ? (
        <span className="flex flex-col">
          <span className="font-display text-[1em] font-extrabold uppercase tracking-[0.01em] text-cream">
            Mobil <span className="text-brand-500">Plus</span> LA
          </span>
          {/* Crtica pre grada — prepisana sa logotipa, gde „NOVI SAD" stoji
              između dve plave crte. */}
          <span className="mt-[0.4em] flex items-center gap-[0.45em] text-[0.55em] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            <span aria-hidden className="block h-px w-[1em] bg-brand" />
            Novi Sad
          </span>
        </span>
      ) : null}
    </span>
  );
}
