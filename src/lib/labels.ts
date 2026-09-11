import type { MessageKey } from "@/lib/i18n/en";
import type { StockStatus } from "@/lib/stock";

// Copy that must stay consistent across the flow. An action keeps its name:
// the Take button produces "Took 5" and a TAKE movement rendered as "Took".
//
// These map a value from the database onto a dictionary key, so the wording
// itself lives in one place per language and the mapping stays shared.

const MOVEMENT_KEYS = {
  TAKE: "movement.TAKE",
  RECEIVE: "movement.RECEIVE",
  COUNT: "movement.COUNT",
  ADJUST: "movement.ADJUST",
} as const satisfies Record<string, MessageKey>;

/** The dictionary key for a movement type, or null for an unknown one. */
export function movementKey(type: string): MessageKey | null {
  return MOVEMENT_KEYS[type as keyof typeof MOVEMENT_KEYS] ?? null;
}

/** "ok" is silent: only low and out get a word beside the numeral. */
export function statusKey(status: StockStatus): MessageKey | null {
  if (status === "low") return "filters.statusLow";
  if (status === "out") return "filters.statusOut";
  return null;
}
