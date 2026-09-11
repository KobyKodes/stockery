import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { stockStatus, suggestedReorderQty } from "@/lib/stock";

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
