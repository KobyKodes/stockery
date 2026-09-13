// Pure stock maths. No database, no React. Everything here has a test.

import type { Locale } from "@/lib/i18n/config";

export type StockStatus = "ok" | "low" | "out";

export type StockFields = { quantity: number; threshold: number };
export type Measure = "COUNT" | "WEIGHT";

export type PackFields = {
  quantity: number;
  unitName: string;
  packSize: number | null;
  packName: string | null;
  measure?: Measure;
};

/** out when nothing is left, low at or under the threshold, otherwise ok. */
export function stockStatus(item: StockFields): StockStatus {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.threshold) return "low";
  return "ok";
}

/**
 * Plural for plain kitchen words: bag/bags, box/boxes, case/cases.
 *
 * Unit and pack names are typed in by the kitchen, not translated, so these
 * English rules only apply while the app is in English. In any other language
 * the word is left exactly as it was entered.
 */
const UNCOUNTABLE = new Set(["each", "pair", "stock", "g", "kg"]);

export function pluralise(word: string, n: number, locale: Locale = "en"): string {
  if (locale !== "en") return word;
  if (n === 1 || UNCOUNTABLE.has(word.trim().toLowerCase())) return word;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/** "3 cases + 4 bags" for packSize 12, quantity 40. "40 bags" without packs. */
export function formatQuantity(item: PackFields, locale: Locale = "en"): string {
  const { quantity, unitName, packSize, packName } = item;
  if (item.measure === "WEIGHT") return formatWeight(quantity, locale);
  if (!packSize || packSize <= 1 || !packName) {
    return `${quantity} ${pluralise(unitName, quantity, locale)}`;
  }
  const packs = Math.floor(quantity / packSize);
  const units = quantity % packSize;
  if (packs === 0) return `${units} ${pluralise(unitName, units, locale)}`;
  const packPart = `${packs} ${pluralise(packName, packs, locale)}`;
  if (units === 0) return packPart;
  return `${packPart} + ${units} ${pluralise(unitName, units, locale)}`;
}

/**
 * A count and its word, ready for "{quantity} {unit}" copy: "3" and "bottles",
 * or for a weighed item "1.25" and "kg".
 */
export function quantityParts(
  item: Pick<PackFields, "unitName" | "measure">,
  n: number,
  locale: Locale = "en",
): { quantity: string; unit: string } {
  if (item.measure === "WEIGHT") {
    const unit = weightUnitFor(n);
    return { quantity: formatWeightValue(n, unit), unit: weightSymbol(unit, locale) };
  }
  return { quantity: String(n), unit: pluralise(item.unitName, n, locale) };
}

/** Convert an entry of {packs, units} to base units. */
export function toBaseUnits(packs: number, units: number, packSize: number | null): number {
  const p = Number.isFinite(packs) ? Math.max(0, Math.floor(packs)) : 0;
  const u = Number.isFinite(units) ? Math.max(0, Math.floor(units)) : 0;
  if (!packSize || packSize <= 1) return p + u;
  return p * packSize + u;
}

/** Split base units into {packs, units} for pre-filling a pack entry. */
export function fromBaseUnits(quantity: number, packSize: number | null): { packs: number; units: number } {
  if (!packSize || packSize <= 1) return { packs: 0, units: quantity };
  return { packs: Math.floor(quantity / packSize), units: quantity % packSize };
}

/** Bar fill 0..1: full at twice the threshold so "plenty" reads as full. */
export function stockBarFraction(item: StockFields): number {
  if (item.quantity <= 0) return 0;
  const full = item.threshold > 0 ? item.threshold * 2 : Math.max(item.quantity, 1);
  return Math.min(1, item.quantity / full);
}

/** Take: never below zero. Reports whether the request was clamped. */
export function applyTake(quantity: number, requested: number): { next: number; taken: number; clamped: boolean } {
  const want = Math.max(0, Math.floor(requested));
  const taken = Math.min(quantity, want);
  return { next: quantity - taken, taken, clamped: taken < want };
}

/** Default order size for the reorder list: back to twice the threshold, at least one pack. */
export function suggestedReorderQty(item: StockFields & { packSize: number | null }): number {
  const toTwiceThreshold = item.threshold * 2 - item.quantity;
  return Math.max(toTwiceThreshold, item.packSize ?? 1, 1);
}

/** Undo is only allowed for a short window and only on the latest movement. */
export const UNDO_WINDOW_MS = 10 * 60 * 1000;

export function canUndo(movement: { createdAt: Date; type: string }, isLatest: boolean, now = new Date()): boolean {
  if (!isLatest) return false;
  if (movement.type === "ADJUST") return false;
  return now.getTime() - movement.createdAt.getTime() <= UNDO_WINDOW_MS;
}

// Weight. A weighed item keeps its quantity in whole grams; these helpers show
// it in grams under a kilo and in kilograms from a kilo up.

export type WeightUnit = "g" | "kg";

// Unit symbols rather than words, so they sit beside a numeral like a label on
// a scale. Digits stay Western in both languages, as they do everywhere else.
const WEIGHT_SYMBOLS: Record<Locale, Record<WeightUnit, string>> = {
  en: { g: "g", kg: "kg" },
  ar: { g: "غ", kg: "كغ" },
};

export function weightSymbol(unit: WeightUnit, locale: Locale = "en"): string {
  return WEIGHT_SYMBOLS[locale][unit];
}

/** Kilograms from a kilo up, grams under it. */
export function weightUnitFor(grams: number): WeightUnit {
  return Math.abs(grams) >= 1000 ? "kg" : "g";
}

/** The number alone in the given unit: 1250 g in kg is "1.25", 50 g in g is "50". */
export function formatWeightValue(grams: number, unit: WeightUnit): string {
  const n = unit === "kg" ? grams / 1000 : grams;
  return n.toLocaleString("en-GB", { maximumFractionDigits: unit === "kg" ? 3 : 0 });
}

/** "750 g", "1.25 kg". */
export function formatWeight(grams: number, locale: Locale = "en"): string {
  const unit = weightUnitFor(grams);
  return `${formatWeightValue(grams, unit)} ${weightSymbol(unit, locale)}`;
}

/** An entry in grams or kilograms as whole grams: 1.5 kg is 1500. Negatives and NaN are 0. */
export function toGrams(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(unit === "kg" ? value * 1000 : value);
}
