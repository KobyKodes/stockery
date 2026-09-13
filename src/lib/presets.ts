// Take presets: the quick buttons in the take sheet. Pure and client-safe.

export const DEFAULT_TAKE_PRESETS = [1, 2, 5, 10];
export const MAX_PRESETS = 6;

/** Quick amounts for a weighed item, in grams. */
export const WEIGHT_PRESETS = [10, 25, 50, 100, 250, 500];

/** Whole numbers from 1 up, unique, sorted, at most six. Falls back to the defaults. */
export function normalisePresets(value: unknown): number[] {
  if (!Array.isArray(value)) return DEFAULT_TAKE_PRESETS;
  const clean = [...new Set(value.map((v) => Math.floor(Number(v))).filter((n) => Number.isFinite(n) && n >= 1))]
    .sort((a, b) => a - b)
    .slice(0, MAX_PRESETS);
  return clean.length ? clean : DEFAULT_TAKE_PRESETS;
}
