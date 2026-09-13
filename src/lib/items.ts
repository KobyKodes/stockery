import { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import "server-only";
import { stockStatus } from "@/lib/stock";
import { descendantLeafIds, getLocationTree, leafOrder, type LocationNode } from "@/lib/locations";
import type { ItemRow } from "@/lib/item-view";

export type { ItemRow, LocationGroup } from "@/lib/item-view";
export { groupByLocation, runningLow } from "@/lib/item-view";
import type { ListQuery } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

// Server-side reads shared by pages and route handlers. Image bytes are never
// selected here; they only travel through /api/items/[id]/image.

export const itemSelect = {
  id: true,
  name: true,
  description: true,
  measure: true,
  quantity: true,
  unitName: true,
  packSize: true,
  packName: true,
  threshold: true,
  orderedAt: true,
  sortOrder: true,
  archived: true,
  imageType: true,
  updatedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, sortOrder: true } },
  location: { select: { id: true, name: true, sortOrder: true, parent: { select: { name: true } } } },
} satisfies Prisma.ItemSelect;

type ItemRecord = Prisma.ItemGetPayload<{ select: typeof itemSelect }>;

export function toItemRow(item: ItemRecord): ItemRow {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    measure: item.measure,
    quantity: item.quantity,
    unitName: item.unitName,
    packSize: item.packSize,
    packName: item.packName,
    threshold: item.threshold,
    orderedAt: item.orderedAt?.toISOString() ?? null,
    sortOrder: item.sortOrder,
    archived: item.archived,
    hasImage: item.imageType !== null,
    imageVersion: String(item.updatedAt.getTime()),
    updatedAt: item.updatedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    status: stockStatus(item),
    category: item.category,
    location: item.location
      ? {
          id: item.location.id,
          name: item.location.name,
          sortOrder: item.location.sortOrder,
          parentName: item.location.parent?.name ?? null,
        }
      : null,
  };
}

/**
 * Items may only be assigned to a leaf location. Throws if the location is a
 * store that has shelves (a branch), so the caller gets a clear 400.
 */
export async function assertAssignableLocation(locationId: string | null): Promise<void> {
  if (!locationId) return;
  const childCount = await prisma.location.count({ where: { parentId: locationId } });
  if (childCount > 0) {
    throw new ApiError(400, msg("error.pickShelf"));
  }
}

export function whereFromQuery(query: ListQuery, roots?: LocationNode[]): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = { archived: false };
  if (query.location === "none") where.locationId = null;
  else if (query.location) {
    // A store filter matches every item on its shelves; a leaf matches itself.
    const ids = roots ? descendantLeafIds(roots, query.location) : [query.location];
    where.locationId = ids.length === 1 ? ids[0] : { in: ids };
  }
  if (query.category === "none") where.categoryId = null;
  else if (query.category) where.categoryId = query.category;
  if (query.status === "out") where.quantity = { lte: 0 };
  if (query.status === "low") {
    where.AND = [{ quantity: { gt: 0 } }, { quantity: { lte: prisma.item.fields.threshold } }];
  }
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { description: { contains: query.q, mode: "insensitive" } },
    ];
  }
  return where;
}

/**
 * Items in walk order: by their leaf location's position in the depth-first
 * walk of the store/shelf tree, then manual order, then name. Items with no
 * location (or on a branch, which shouldn't happen) sort last.
 */
export async function listItems(query: ListQuery = {}): Promise<ItemRow[]> {
  const roots = await getLocationTree();
  const rank = new Map(leafOrder(roots).map((id, i) => [id, i]));
  const rows = await prisma.item.findMany({ where: whereFromQuery(query, roots), select: itemSelect });
  const items = rows.map(toItemRow);
  const rankOf = (row: ItemRow) =>
    row.location ? (rank.get(row.location.id) ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;
  return items.sort(
    (a, b) => rankOf(a) - rankOf(b) || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
  );
}

export async function getItemRow(id: string): Promise<ItemRow | null> {
  const row = await prisma.item.findUnique({ where: { id }, select: itemSelect });
  return row ? toItemRow(row) : null;
}
