import { NextResponse } from "next/server";
import { ApiError, handle, type RouteContext } from "@/lib/api";
import { receiveStock } from "@/lib/movements";
import { listReorder } from "@/lib/reorder";
import { prisma } from "@/lib/prisma";
import { msg } from "@/lib/i18n/message";

// The delivery arrived: restock by the requested amount and clear the row.
export const POST = handle<RouteContext<{ id: string }>>(async (_request, { params }) => {
  const { id } = await params;
  const entry = await prisma.reorderEntry.findUnique({ where: { id } });
  if (!entry) throw new ApiError(404, msg("error.rowMissing"));

  const result = await receiveStock(entry.itemId, entry.requestedQty, msg("note.fromReorder"));
  await prisma.reorderEntry.deleteMany({ where: { id } });
  return NextResponse.json({ item: result.item, applied: result.applied, entries: await listReorder() });
});
