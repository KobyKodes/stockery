import "server-only";
import type { Prisma } from "@prisma/client";
import { itemSelect, toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { stockStatus, suggestedReorderQty } from "@/lib/stock";
import type { ReorderRow } from "@/lib/reorder-view";

type Tx = Prisma.TransactionClient;

/**
 * Keeps the reorder list honest after any quantity change:
 * low or out with no entry -> add one automatically;
 * back to ok with an automatic, unticked entry -> remove it.
 * Manual and ticked entries are left alone.
 */
export async function syncReorderEntry(itemId: string, tx: Tx = prisma) {
  const item = await tx.item.findUnique({
    where: { id: itemId },
    select: { quantity: true, threshold: true, packSize: true, archived: true, reorder: true },
  });
  if (!item) return;
  const status = item.archived ? "ok" : stockStatus(item);

  if (status !== "ok" && !item.reorder) {
    await tx.reorderEntry.create({
      data: { itemId, requestedQty: suggestedReorderQty(item), addedAuto: true },
    });
    return;
  }
  if (status === "ok" && item.reorder?.addedAuto && !item.reorder.checked) {
    await tx.reorderEntry.delete({ where: { id: item.reorder.id } });
  }
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
