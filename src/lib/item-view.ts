// Client-safe shapes and pure helpers for the storeroom list. No Prisma here:
// this module is imported by client components.
import type { Measure, StockStatus } from "@/lib/stock";

export type ItemRow = {
  id: string;
  name: string;
  description: string | null;
  measure: Measure;
  quantity: number;
  unitName: string;
  packSize: number | null;
  packName: string | null;
  threshold: number;
  /** ISO time the item was marked as ordered; null when nothing is on the way. */
  orderedAt: string | null;
  sortOrder: number;
  archived: boolean;
  hasImage: boolean;
  imageVersion: string;
  updatedAt: string;
  createdAt: string;
  status: StockStatus;
  category: { id: string; name: string; sortOrder: number } | null;
  location: { id: string; name: string; sortOrder: number; parentName: string | null } | null;
};

/**
 * "Store 2 › Shelf A" when a location sits inside a store, else just its name.
 *
 * The chevron stays the same character in both languages: rendered inside a
 * <bdi>, it takes the direction of the names around it, so it points the way
 * that pair of names is read whatever script they are in.
 */
export function locationLabel(location: ItemRow["location"]): string | null {
  if (!location) return null;
  return location.parentName ? `${location.parentName} › ${location.name}` : location.name;
}

export type ItemGroup = {
  key: string;
  name: string;
  items: ItemRow[];
};

/** @deprecated kept for reference; the storeroom list groups by category. */
export type LocationGroup = ItemGroup;

/** Groups a walk-ordered list by location, with a final "Unassigned" group. */
export function groupByLocation(items: ItemRow[], unassignedLabel = "Unassigned"): ItemGroup[] {
  const groups = new Map<string, ItemGroup>();
  for (const item of items) {
    const key = item.location?.id ?? "none";
    const name = item.location?.name ?? unassignedLabel;
    const group = groups.get(key) ?? { key, name, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

/**
 * Groups items by category, ordered by the category's own sortOrder, with a
 * final "Uncategorized" group. Item order within a group is preserved.
 */
export function groupByCategory(items: ItemRow[], uncategorizedLabel = "Uncategorized"): ItemGroup[] {
  const groups = new Map<string, ItemGroup & { sortOrder: number }>();
  for (const item of items) {
    const key = item.category?.id ?? "none";
    const name = item.category?.name ?? uncategorizedLabel;
    const sortOrder = item.category?.sortOrder ?? Number.POSITIVE_INFINITY;
    const group = groups.get(key) ?? { key, name, sortOrder, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .map((group) => ({ key: group.key, name: group.name, items: group.items }));
}

/** Out first, then low, then by name. */
export function runningLow(items: ItemRow[]): ItemRow[] {
  const rank: Record<StockStatus, number> = { out: 0, low: 1, ok: 2 };
  return items
    .filter((i) => i.status !== "ok")
    .sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name));
}
