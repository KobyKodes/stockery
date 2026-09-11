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

// Adding by hand marks the entry manual, so it is never cleared automatically.
export const POST = handle(async (request) => {
  const { itemId, requestedQty } = await parseBody(request, reorderAddBody);
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    select: { quantity: true, threshold: true, packSize: true, reorder: { select: { id: true } } },
  });
  if (!item) throw new ApiError(404, msg("error.itemMissing"));
  if (item.reorder) throw new ApiError(409, msg("error.alreadyOnList"));

  await prisma.reorderEntry.create({
    data: { itemId, requestedQty: requestedQty ?? suggestedReorderQty(item), addedAuto: false },
  });
  return NextResponse.json({ entries: await listReorder() }, { status: 201 });
});
