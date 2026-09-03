import { Instagram, MessageCircle, MessageSquare, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { inquiryFor, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Načini kontakta — jedini put do kupovine na ovom sajtu.
 *
 * Vlasnik ne želi korpu ni checkout: kupac vidi cenu, pa piše na Viber,
 * WhatsApp ili Instagram, ili pozove. Zato ova komponenta stoji ISPOD svake
 * cene — na kartici, na stranici proizvoda i u lebdećem dugmetu.
 *
 * Nema stanja pa je namerno server komponenta — ne šalje JS na klijent, a
 * može se uvesti i u klijentske komponente (npr. FloatingContact).
 */

export type KanalKey = "viber" | "whatsapp" | "instagram" | "telefon";

export type KontaktKanal = {
  key: KanalKey;
  /** Tekst na dugmetu kad ima mesta. */
  label: string;
  /** Pun opis za čitač ekrana i `title` na ikonicama bez teksta. */
  aria: string;
  href: string;
  Ikonica: LucideIcon;
  /** Boja kanala (`bg` + `hover:bg`) — dolazi uz svaki kanal, ne uz raspored. */
  boja: string;
  /** `viber://` i `tel:` su deep linkovi — novi tab bi ostavio praznu stranicu. */
  eksterno: boolean;
};

/**
 * Boje kanala su namerno izvan brend palete: zeleni WhatsApp i ljubičasti Viber
 * kupac prepozna iz oka, brže nego bilo koji tekst. Ikonice su lucide (nema
 * brend glifova), pa identitet kanala nose boja i `aria-label`, ne oblik.
 */
const INSTAGRAM_GRADIJENT =
  "bg-[linear-gradient(135deg,#F58529,#DD2A7B,#8134AF,#515BD4)] hover:brightness-110";

/**
 * Kanali za dati kontekst. Izvučeno u funkciju da i FloatingContact crta iste
 * kanale, boje i linkove — jedna lista, dva rasporeda.
 */
export function kanaliKontakta(naziv?: string, cena?: string): KontaktKanal[] {
  // Kad znamo o kom je artiklu reč, poruka ide predpopunjena: vlasnik ne mora
  // da pita „koji model?", a kupac ne mora da prepisuje naziv iz kataloga.
  const poruka = naziv ? inquiryFor(naziv, cena) : site.defaultInquiry;
  const zaArtikal = naziv ? ` — upit za ${naziv}` : "";

  return [
    {
      key: "viber",
      label: "Viber",
      aria: `Pošalji upit na Viber${zaArtikal}`,
      href: site.viberHref(poruka),
      Ikonica: MessageSquare,
      boja: "bg-[#7360F2] hover:bg-[#5C4BD8]",
      eksterno: false,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      aria: `Pošalji upit na WhatsApp${zaArtikal}`,
      href: site.whatsappHref(poruka),
      Ikonica: MessageCircle,
      boja: "bg-[#25D366] hover:bg-[#1FB855]",
      eksterno: true,
    },
    {
      key: "instagram",
      // Handle umesto reči „Instagram" — kupac vidi tačan profil na koji piše.
      label: `@${site.socials.instagramHandle}`,
      aria: `Piši nam na Instagramu, profil @${site.socials.instagramHandle}${zaArtikal}`,
      href: site.socials.instagram,
      Ikonica: Instagram,
      boja: INSTAGRAM_GRADIJENT,
      eksterno: true,
    },
    {
      key: "telefon",
      label: site.phoneDisplay,
      aria: `Pozovi ${site.phoneDisplay}`,
      href: site.telHref,
      Ikonica: Phone,
      boja: "bg-brand hover:bg-brand-600",
      eksterno: false,
    },
  ];
}

/**
 * Oblik dugmeta je prepisan iz `buttonVariants` (varijanta „primary") umesto
 * uvezen: `primary` nosi svoj `hover:bg-*`, koji bi tailwind-merge prelio preko
 * Instagram gradijenta. Ovako kanali dele oblik sa ostatkom sajta, a boju drže.
 */
const OBLIK =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold text-cream shadow-soft transition-all duration-200 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98]";

const RASPORED = {
  red: "flex flex-wrap items-center gap-2.5",
  kolona: "flex flex-col gap-2.5",
  // Na kartici je dugmadi malo mesta — samo ikonice, u jednom redu.
  kompakt: "flex flex-wrap items-center gap-2",
} as const;

export type KontaktLayout = keyof typeof RASPORED;

type Props = {
  /** Naziv artikla — ulazi u predpopunjenu poruku na Viber/WhatsApp. */
  naziv?: string;
  /** Formatirana cena (npr. „2.340 RSD") — dodaje se u istu poruku. */
  cena?: string;
  layout?: KontaktLayout;
  className?: string;
};

export function KontaktDugmad({
  naziv,
  cena,
  layout = "red",
  className,
}: Props) {
  const kanali = kanaliKontakta(naziv, cena);
  const kompakt = layout === "kompakt";

  return (
    <div className={cn(RASPORED[layout], className)}>
      {kanali.map(({ key, label, aria, href, Ikonica, boja, eksterno }) => (
        <a
          key={key}
          href={href}
          aria-label={aria}
          // Bez teksta ikonica sama ne govori ništa — `title` daje tooltip mišem.
          title={kompakt ? aria : undefined}
          {...(eksterno
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className={cn(
            OBLIK,
            kompakt ? "h-9 w-9 p-0" : "h-11 px-5 text-[0.95rem]",
            layout === "kolona" && "w-full",
            boja,
          )}
        >
          <Ikonica
            aria-hidden
            className={kompakt ? "h-4 w-4" : "h-[1.05rem] w-[1.05rem]"}
          />
          {!kompakt && <span className="truncate">{label}</span>}
        </a>
      ))}
    </div>
  );
}
