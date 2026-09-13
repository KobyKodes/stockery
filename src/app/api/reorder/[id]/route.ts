import { NextResponse } from "next/server";
import { handle, parseBody, type RouteContext } from "@/lib/api";
import { listReorder } from "@/lib/reorder";
import { prisma } from "@/lib/prisma";
import { reorderPatch } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

export const PATCH = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const patch = await parseBody(request, reorderPatch);
  await prisma.reorderEntry.update({ where: { id }, data: patch });
  return NextResponse.json({ entries: await listReorder() });
});

// Removing by hand keeps the item's stock untouched. A row that was added by
// hand also takes away the ordered mark that adding it set.
export const DELETE = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  await prisma.$transaction(async (tx) => {
    const entry = await tx.reorderEntry.delete({ where: { id } });
    if (!entry.addedAuto) {
      await tx.item.update({ where: { id: entry.itemId }, data: { orderedAt: null } });
    }
  });
  return NextResponse.json({ entries: await listReorder() });
});
