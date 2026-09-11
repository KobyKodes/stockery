import { NextResponse } from "next/server";
import { ApiError, handle, parseBody, type RouteContext } from "@/lib/api";
import { itemSelect, toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { syncReorderEntry } from "@/lib/reorder";
import { itemPatch } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

export const GET = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id }, select: itemSelect });
  if (!item) throw new ApiError(404, "That item isn't in the storeroom.");
  return NextResponse.json({ item: toItemRow(item) });
});

export const PATCH = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const patch = await parseBody(request, itemPatch);
  const existing = await prisma.item.findUnique({ where: { id }, select: { quantity: true, packSize: true } });
  if (!existing) throw new ApiError(404, "That item isn't in the storeroom.");

  const updated = await prisma.$transaction(async (tx) => {
    const quantityChanged = patch.quantity !== undefined && patch.quantity !== existing.quantity;
    const packSize = patch.packSize === undefined ? existing.packSize : patch.packSize;
    const item = await tx.item.update({
      where: { id },
      data: {
        ...patch,
        packName: packSize ? patch.packName : null,
        ...(quantityChanged
          ? {
              movements: {
                create: {
                  type: "ADJUST",
                  delta: patch.quantity! - existing.quantity,
                  quantityAfter: patch.quantity!,
                  note: "Edited in the item form",
                },
              },
            }
          : {}),
      },
      select: itemSelect,
    });
    await syncReorderEntry(id, tx);
    return item;
  });

  return NextResponse.json({ item: toItemRow(updated) });
});

export const DELETE = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const existing = await prisma.item.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(404, "That item isn't in the storeroom.");
  await prisma.item.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
