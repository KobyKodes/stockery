import { NextResponse } from "next/server";
import { ApiError, handle, parseBody, type RouteContext } from "@/lib/api";
import { toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { setOrdered } from "@/lib/reorder";
import { orderedBody } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

// Mark an item as ordered (more is on the way), or clear the mark. Marking
// takes the item off the reorder list.
export const POST = handle<RouteContext<{ id: string }>>(async (request, { params }) => {
  const { id } = await params;
  const { ordered } = await parseBody(request, orderedBody);
  const existing = await prisma.item.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, msg("error.itemMissing"));
  const item = await setOrdered(id, ordered);
  return NextResponse.json({ item: toItemRow(item) });
});
