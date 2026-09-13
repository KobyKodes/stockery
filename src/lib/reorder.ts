import "server-only";
import type { Prisma } from "@prisma/client";
import { itemSelect, toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { stockStatus, suggestedReorderQty } from "@/lib/stock";
import type { ReorderRow } from "@/lib/reorder-view";

type Tx = Prisma.TransactionClient;

/**
 * Keeps the reorder list honest after any quantity change:
 * low or out with no entry, and not already ordered -> add one automatically;
 * back to ok with an automatic, unticked entry -> remove it.
 * Manual and ticked entries are left alone.
 */
export async function syncReorderEntry(itemId: string, tx: Tx = prisma) {
  const item = await tx.item.findUnique({
    where: { id: itemId },
    select: { quantity: true, threshold: true, packSize: true, archived: true, orderedAt: true, reorder: true },
  });
  if (!item) return;
  const status = item.archived ? "ok" : stockStatus(item);

  // An ordered item has more on the way, so there is nothing to buy.
  if (status !== "ok" && !item.reorder && !item.orderedAt) {
    await tx.reorderEntry.create({
      data: { itemId, requestedQty: suggestedReorderQty(item), addedAuto: true },
    });
    return;
  }
  if (status === "ok" && item.reorder?.addedAuto && !item.reorder.checked) {
    await tx.reorderEntry.delete({ where: { id: item.reorder.id } });
  }
}

/**
 * Marks an item as ordered, or clears the mark. Marking takes it off the
 * reorder list, since there is nothing left to buy; clearing lets the list
 * pick it up again if it is still low.
 */
export async function setOrdered(itemId: string, ordered: boolean) {
  return prisma.$transaction(async (tx) => {
    await tx.item.update({ where: { id: itemId }, data: { orderedAt: ordered ? new Date() : null } });
    if (ordered) await tx.reorderEntry.deleteMany({ where: { itemId } });
    else await syncReorderEntry(itemId, tx);
    return tx.item.findUniqueOrThrow({ where: { id: itemId }, select: itemSelect });
  });
}

/** The shopping list, item and all, in walk order. */
export async function listReorder(): Promise<ReorderRow[]> {
  const entries = await prisma.reorderEntry.findMany({
    orderBy: [{ checked: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      requestedQty: true,
      checked: true,
      addedAuto: true,
      createdAt: true,
      item: { select: itemSelect },
    },
  });
  return entries.map((e) => ({
    id: e.id,
    requestedQty: e.requestedQty,
    checked: e.checked,
    addedAuto: e.addedAuto,
    createdAt: e.createdAt.toISOString(),
    item: toItemRow(e.item),
  }));
}
