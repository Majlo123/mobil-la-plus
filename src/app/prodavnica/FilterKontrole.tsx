"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  SORT_OPTIONS,
  type FacetDef,
  type FacetOption,
  type SortKey,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
// `import type` — samo oblik izbora, ne i funkcije: `shop-query.ts` uvlači ceo
// katalog i sme samo na serveru, a tip se briše pri kompajliranju.
import type { Izbor } from "@/lib/shop-query";

/**
 * Kontrole filtera prodavnice — jedina klijentska komponenta na strani.
 *
 * Ne drži ni jedan proizvod: sve što radi je da prepiše URL, a server ponovo
 * filtrira katalog i vrati novu stranu (vidi `src/lib/catalog.ts` zašto katalog
 * od 14.500 artikala ne ide u pretraživač). Zato ovde nema ni „loading" stanja —
 * Next drži staru stranu na ekranu dok nova ne stigne.
 */

type Faseta = { def: FacetDef; opcije: FacetOption[] };

type Props = {
  fasete: Faseta[];
  izbor: Izbor;
  q: string;
  sort: SortKey;
  /** Broj pogodaka — javlja se čitaču ekrana posle svake izmene filtera. */
  ukupno: number;
};

/** Vrednosti fasete se u URL-u čuvaju kao `tip=maske,stakla`. */
const parseList = (raw: string | null) =>
  raw ? raw.split(",").map((v) => v.trim()).filter(Boolean) : [];

const POLJE =
  "h-12 w-full rounded-xl border border-input bg-ink-800 text-sm text-cream outline-none transition-colors placeholder:text-muted-foreground hover:border-brand/40 focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-ring/60";

export function FilterKontrole({ fasete, izbor, q, sort, ukupno }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  /* ------------------------------ URL kao state ----------------------------- */

  // `router.replace` ne menja URL odmah, pa dva brza klika oba pročitaju isti
  // stari `params` i drugi pregazi prvi. Zato se izmene skupljaju ovde dok se
  // navigacija ne izvrši.
  const pending = useRef<URLSearchParams | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [params]);

  const setParams = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      const next = pending.current ?? new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(changes)) {
        const serialized = Array.isArray(value) ? value.join(",") : value;
        if (serialized) next.set(key, serialized);
        else next.delete(key);
      }
      // Svaka izmena filtera, pretrage ili sortiranja menja skup rezultata, pa
      // stara strana više ne znači ništa — „strana 7" posle filtriranja lako
      // ostane prazna. Uvek se vraćamo na prvu.
      next.delete("strana");

      pending.current = next;
      const qs = next.toString();
      router.replace(qs ? `/prodavnica?${qs}` : "/prodavnica", { scroll: false });
    },
    [params, router],
  );

  /* -------------------------------- Pretraga -------------------------------- */

  // Polje piše u lokalno stanje odmah (inače „zaostaje" za tastaturom), a URL
  // se osvežava sa odlaganjem — svaki taster bi inače bio jedna navigacija i
  // jedno serversko filtriranje nad 14.000 artikala.
  const [tekst, setTekst] = useState(q);

  // Šta smo poslednje MI upisali u URL. Isti problem kao kod `pending`, samo u
  // vremenu: dok odgovor servera stigne, korisnik je već dokucao još slova, pa
  // bi eho našeg upisa („iph") vratio polje unazad i pojeo „one 15".
  const poslato = useRef(q);

  useEffect(() => {
    // Kad `q` stigne spolja — dugme „nazad", link sa gotovim filterom — polje
    // mora da ga prati. Sopstveni eho se preskače: lokalni tekst je noviji.
    if (q === poslato.current) return;
    poslato.current = q;
    setTekst(q);
  }, [q]);

  useEffect(() => {
    if (tekst === q) return;
    const timer = setTimeout(() => {
      poslato.current = tekst;
      setParams({ q: tekst || null });
    }, 250);
    return () => clearTimeout(timer);
  }, [tekst, q, setParams]);

  /**
   * Dodaje/uklanja jednu vrednost fasete. Trenutni izbor se čita iz `pending`
   * (ili URL-a), nikad iz propsa — vidi komentar uz `pending`.
   */
  const toggleFaseta = (facetKey: string, value: string) => {
    const current = pending.current ?? new URLSearchParams(params.toString());
    const values = parseList(current.get(facetKey));
    setParams({
      [facetKey]: values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value],
    });
  };

  const ponisti = () => {
    // Polje se prazni odmah, ne tek kad odgovor stigne — inače stari tekst
    // stoji u njemu pola sekunde posle klika na „Poništi filtere".
    setTekst("");
    poslato.current = "";
    setParams({
      q: null,
      ...Object.fromEntries(fasete.map((f) => [f.def.key, null])),
    });
  };

  // Isti izraz kao `aktivnih` na serveru, ali računat iz propsa — dugme mora da
  // se pojavi/nestane u istom trenutku kad se promeni i broj rezultata.
  const aktivnih = Object.values(izbor).flat().length + (q ? 1 : 0);

  return (
    <div className="rounded-2xl border border-ink-600 bg-ink-800 p-4 shadow-card sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fasete.map(({ def, opcije }) => (
          <MultiSelect
            key={def.key}
            label={def.label}
            placeholder={def.placeholder}
            options={opcije}
            selected={izbor[def.key] ?? []}
            onToggle={(value) => toggleFaseta(def.key, value)}
            onClear={() => setParams({ [def.key]: null })}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-ink-600 pt-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            aria-label="Pretraga artikala"
            autoComplete="off"
            placeholder="Pretraga — npr. „staklo iphone 15” ili „punjač type c”"
            className={cn(POLJE, "pl-11 pr-4")}
          />
        </div>

        <div className="relative shrink-0 sm:w-56">
          <select
            value={sort}
            onChange={(e) => {
              const izabrano = e.target.value as SortKey;
              // „Po nazivu" je podrazumevano — ne piše se u URL da linkovi koji
              // se dele ostanu čitljivi.
              setParams({ sort: izabrano === "naziv" ? null : izabrano });
            }}
            aria-label="Poređaj rezultate"
            /* `appearance-none` + naša strelica: podrazumevani okvir selecta se
               na crnoj podlozi razlikuje od ostalih polja u redu. */
            className={cn(POLJE, "cursor-pointer appearance-none pl-4 pr-10")}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        {aktivnih > 0 ? (
          <button
            type="button"
            onClick={ponisti}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-ink-700 hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <X aria-hidden className="h-4 w-4" />
            Poništi filtere ({aktivnih})
          </button>
        ) : null}
      </div>

      {/* Filtriranje menja mrežu ispod bez ijedne vidljive promene fokusa, pa
          čitač ekrana inače ne dobije nikakvu povratnu informaciju. */}
      <p role="status" aria-live="polite" className="sr-only">
        Rezultata posle filtriranja: {ukupno}
      </p>
    </div>
  );
}
