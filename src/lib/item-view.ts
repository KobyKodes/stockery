// Client-safe shapes and pure helpers for the storeroom list. No Prisma here:
// this module is imported by client components.
import type { StockStatus } from "@/lib/stock";

export type ItemRow = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitName: string;
  packSize: number | null;
  packName: string | null;
  threshold: number;
  sortOrder: number;
  archived: boolean;
  hasImage: boolean;
  imageVersion: string;
  updatedAt: string;
  createdAt: string;
  status: StockStatus;
  category: { id: string; name: string; sortOrder: number } | null;
  location: { id: string; name: string; sortOrder: number } | null;
};

export type LocationGroup = {
  key: string;
  name: string;
  items: ItemRow[];
};

/** Groups a walk-ordered list by location, with a final "Unassigned" group. */
export function groupByLocation(items: ItemRow[]): LocationGroup[] {
  const groups = new Map<string, LocationGroup>();
  for (const item of items) {
    const key = item.location?.id ?? "none";
    const name = item.location?.name ?? "Unassigned";
    const group = groups.get(key) ?? { key, name, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/** Out first, then low, then by name. */
export function runningLow(items: ItemRow[]): ItemRow[] {
  const rank: Record<StockStatus, number> = { out: 0, low: 1, ok: 2 };
  return items
    .filter((i) => i.status !== "ok")
    .sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
}
