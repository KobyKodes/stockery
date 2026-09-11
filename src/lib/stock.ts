// Pure stock maths. No database, no React. Everything here has a test.

export type StockStatus = "ok" | "low" | "out";

export type StockFields = { quantity: number; threshold: number };
export type PackFields = {
  quantity: number;
  unitName: string;
  packSize: number | null;
  packName: string | null;
};

/** out when nothing is left, low at or under the threshold, otherwise ok. */
export function stockStatus(item: StockFields): StockStatus {
  if (item.quantity <= 0) return "out";
  if (item.quantity <= item.threshold) return "low";
  return "ok";
}

/** Plural for plain kitchen words: bag/bags, box/boxes, case/cases. */
export function pluralise(word: string, n: number): string {
  if (n === 1) return word;
  if (/(s|x|z|ch|sh)$/i.test(word)) return `${word}es`;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

/** "3 cases + 4 bags" for packSize 12, quantity 40. "40 bags" without packs. */
export function formatQuantity(item: PackFields): string {
  const { quantity, unitName, packSize, packName } = item;
  if (!packSize || packSize <= 1 || !packName) {
    return `${quantity} ${pluralise(unitName, quantity)}`;
  }
  const packs = Math.floor(quantity / packSize);
  const units = quantity % packSize;
  if (packs === 0) return `${units} ${pluralise(unitName, units)}`;
  const packPart = `${packs} ${pluralise(packName, packs)}`;
  if (units === 0) return packPart;
  return `${packPart} + ${units} ${pluralise(unitName, units)}`;
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
