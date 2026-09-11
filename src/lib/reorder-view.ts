// Client-safe shape for the reorder list.
import type { Locale } from "@/lib/i18n/config";
import type { ItemRow } from "@/lib/item-view";
import { formatQuantity } from "@/lib/stock";

export type ReorderRow = {
  id: string;
  requestedQty: number;
  checked: boolean;
  addedAuto: boolean;
  createdAt: string;
  item: ItemRow;
};

/**
 * What to ask the supplier for: "2 cases", "1 case + 1 roll", "3 rolls".
 * The base number is already in the field beside it, so it is not repeated.
 */
export function orderAmount(row: Pick<ReorderRow, "requestedQty" | "item">, locale: Locale = "en"): string {
  return formatQuantity({ ...row.item, quantity: row.requestedQty }, locale);
}

/** A plain-text list for texting to a supplier, in the reader's language. */
export function asPlainText(rows: ReorderRow[], heading = "Storeroom order", locale: Locale = "en"): string {
  const lines = rows.map((r) => `- ${r.item.name}: ${orderAmount(r, locale)}`);
  return [heading, ...lines].join("\n");
}
