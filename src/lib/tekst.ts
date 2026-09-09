/**
 * Kako se stvari zovu i pišu na srpskom — deljeno između svih strana.
 *
 * Postoji zato što su se ista dva pravila prepisivala iz strane u stranu i
 * počela da se razilaze: `artikala()` je bio prepisan na PET mesta, a pun naziv
 * modela na dva, u dve verzije koje se ne slažu na svakom ulazu. Naslov i
 * `<h1>` na `/za-telefon/<brend>/<model>` i na `/za-telefon/<brend>/<model>/<tip>`
 * moraju da imenuju isti telefon isto — inače dve strane koje Google vidi kao
 * par (nadstrana i podstrana) tvrde da su o različitim uređajima.
 *
 * Modul uvozi samo `normalize` iz `@/lib/catalog` i TIP iz `@/lib/products`
 * (`import type`, briše se pri kompilaciji), pa ne uvlači katalog od 1,5 MB i
 * sme i u klijentski kod.
 */

import { normalize } from "@/lib/catalog";
import type { ModelInfo } from "@/lib/products";

/**
 * Srpska množina uz broj: „1 artikal", „3 artikla", „25 artikala".
 *
 * Brojevi ovde idu od jedinice do više hiljada i nisu poznati u trenutku
 * pisanja teksta (dolaze iz kataloga), pa se oblik mora računati. Pravilo je
 * uobičajeno srpsko: jednina na 1 osim na 11, oblik na -a za 2–4 osim za
 * 12–14, inače genitiv množine.
 */
export function artikala(n: number): string {
  const jedinice = n % 10;
  const desetice = n % 100;
  if (jedinice === 1 && desetice !== 11) return "artikal";
  if (jedinice >= 2 && jedinice <= 4 && (desetice < 12 || desetice > 14)) return "artikla";
  return "artikala";
}

/**
 * Podmarke iz naziva marke: „Apple / iPhone" → [„Apple", „iPhone"].
 *
 * Katalog marku ume da napiše kao spisak, jer kupac tako i traži („Xiaomi /
 * Redmi / Poco"). Svaka stavka se računa kao punopravno ime te marke.
 */
export const podmarke = (brandLabel: string): string[] =>
  brandLabel.split("/").map((deo) => deo.trim()).filter(Boolean);

/**
 * Kratko ime marke za rečenice — „Drugi Apple modeli".
 *
 * Pun `brandLabel` se ne može ubaciti u rečenicu: „Drugi Apple / iPhone modeli"
 * se ne čita kao srpski.
 */
export const glavnaMarka = (brandLabel: string): string =>
  podmarke(brandLabel)[0] ?? brandLabel;

/**
 * Pun naziv modela za naslove i meta opise — onako kako se model kuca u
 * pretragu: „Samsung Galaxy S23", „iPhone 13", „Redmi Note 12", „Google Pixel 7 Pro".
 *
 * `ModelInfo.label` je samo ono što piše na telefonu („Galaxy S23", „G300",
 * „Blade A3"), pa bez marke pola naslova ne bi ličilo ni na šta što se
 * pretražuje. Marka se ipak ne lepi svuda:
 *
 *  - `brandLabel` je oblika „Apple / iPhone" i „Xiaomi / Redmi / Poco" — jedan
 *    ključ pokriva više trgovačkih imena i SVAKO od njih se računa kao već
 *    prisutna marka. Zato „iPhone 15 Pro" i „Redmi Note 12" ostaju kakvi jesu
 *    (tako se i kuca u pretragu), dok „Mi 11 Lite" dobija „Xiaomi" ispred.
 *  - kad marka ipak ide ispred, reč koja bi se ponovila na spoju se izostavlja:
 *    „Google Pixel" + „Pixel 7 Pro" → „Google Pixel 7 Pro", a ne „Google Pixel
 *    Pixel 7 Pro".
 *
 * Poređenje ide preko `normalize` (bez dijakritike i velikih slova) i po celoj
 * reči, da „LG" ne bi progutao model koji slučajno počinje tim slovima.
 *
 * Skidanje samo POKLOPLJENIH reči s kraja marke (a ne bezuslovno prve reči
 * marke) je namerno: dvorečna marka čiji se drugi deo ne ponavlja u modelu
 * ostaje cela, pa se ime ne osiromašuje kad katalog jednom dobije takav model.
 */
export function punNazivModela(info: ModelInfo): string {
  const label = normalize(info.label);
  const imenaMarke = podmarke(info.brandLabel);

  const vecUNazivu = imenaMarke.some(
    (ime) => label === normalize(ime) || label.startsWith(`${normalize(ime)} `),
  );
  if (vecUNazivu) return info.label;

  const reci = (imenaMarke[0] ?? "").split(/\s+/).filter(Boolean);
  const prvaRecModela = info.label.split(/\s+/)[0] ?? "";
  while (reci.length > 0 && normalize(reci[reci.length - 1]) === normalize(prvaRecModela)) {
    reci.pop();
  }
  return reci.length > 0 ? `${reci.join(" ")} ${info.label}` : info.label;
}
