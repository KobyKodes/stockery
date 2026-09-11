import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import "server-only";
import { stockStatus } from "@/lib/stock";
import type { ItemRow } from "@/lib/item-view";

export type { ItemRow, LocationGroup } from "@/lib/item-view";
export { groupByLocation, runningLow } from "@/lib/item-view";
import type { ListQuery } from "@/lib/validation";

// Server-side reads shared by pages and route handlers. Image bytes are never
// selected here; they only travel through /api/items/[id]/image.

export const itemSelect = {
  id: true,
  name: true,
  description: true,
  quantity: true,
  unitName: true,
  packSize: true,
  packName: true,
  threshold: true,
  sortOrder: true,
  archived: true,
  imageType: true,
  updatedAt: true,
  createdAt: true,
  category: { select: { id: true, name: true, sortOrder: true } },
  location: { select: { id: true, name: true, sortOrder: true } },
} satisfies Prisma.ItemSelect;

type ItemRecord = Prisma.ItemGetPayload<{ select: typeof itemSelect }>;

export function toItemRow(item: ItemRecord): ItemRow {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    quantity: item.quantity,
    unitName: item.unitName,
    packSize: item.packSize,
    packName: item.packName,
    threshold: item.threshold,
    sortOrder: item.sortOrder,
    archived: item.archived,
    hasImage: item.imageType !== null,
    imageVersion: String(item.updatedAt.getTime()),
    updatedAt: item.updatedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
    status: stockStatus(item),
    category: item.category,
    location: item.location,
  };
}

export function whereFromQuery(query: ListQuery): Prisma.ItemWhereInput {
  const where: Prisma.ItemWhereInput = { archived: false };
  if (query.location === "none") where.locationId = null;
  else if (query.location) where.locationId = query.location;
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

/** Items in walk order: location sortOrder, then manual order, then name. Unassigned last. */
export async function listItems(query: ListQuery = {}): Promise<ItemRow[]> {
  const rows = await prisma.item.findMany({
    where: whereFromQuery(query),
    select: itemSelect,
    orderBy: [{ location: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const items = rows.map(toItemRow);
  // Prisma sorts nulls first on a relation order; the brief wants "Unassigned" last.
  const placed = items.filter((i) => i.location);
  const unassigned = items.filter((i) => !i.location);
  return [...placed, ...unassigned];
}

export async function getItemRow(id: string): Promise<ItemRow | null> {
  const row = await prisma.item.findUnique({ where: { id }, select: itemSelect });
  return row ? toItemRow(row) : null;
}
