import { NextResponse } from "next/server";
import { ApiError, handle, parseBody } from "@/lib/api";
import { listReorder } from "@/lib/reorder";
import { prisma } from "@/lib/prisma";
import { suggestedReorderQty } from "@/lib/stock";
import { reorderAddBody } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

export const GET = handle(async () => {
  return NextResponse.json({ entries: await listReorder() });
});

// Adding by hand marks the entry manual, so it is never cleared automatically,
// and marks the item as ordered in the storeroom. The row stays on this list
// until the delivery is received.
export const POST = handle(async (request) => {
  const { itemId, requestedQty } = await parseBody(request, reorderAddBody);
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { quantity: true, threshold: true, packSize: true, reorder: { select: { id: true } } },
  });
  if (!item) throw new ApiError(404, msg("error.itemMissing"));
  if (item.reorder) throw new ApiError(409, msg("error.alreadyOnList"));

  await prisma.$transaction([
    prisma.reorderEntry.create({
      data: { itemId, requestedQty: requestedQty ?? suggestedReorderQty(item), addedAuto: false },
    }),
    prisma.item.update({ where: { id: itemId }, data: { orderedAt: new Date() } }),
  ]);
  return NextResponse.json({ entries: await listReorder() }, { status: 201 });
});
