import { NextResponse } from "next/server";
import { ApiError, handle, parseBody, type RouteContext } from "@/lib/api";
import { assertAssignableLocation, itemSelect, toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { syncReorderEntry } from "@/lib/reorder";
import { itemPatch } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

type Ctx = RouteContext<{ id: string }>;

export const GET = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id }, select: itemSelect });
  if (!item) throw new ApiError(404, msg("error.itemMissing"));
  return NextResponse.json({ item: toItemRow(item) });
});

export const PATCH = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const patch = await parseBody(request, itemPatch);
  const existing = await prisma.item.findUnique({ where: { id }, select: { quantity: true, packSize: true, measure: true } });
  if (!existing) throw new ApiError(404, msg("error.itemMissing"));
  if (patch.locationId !== undefined) await assertAssignableLocation(patch.locationId);

  const updated = await prisma.$transaction(async (tx) => {
    const quantityChanged = patch.quantity !== undefined && patch.quantity !== existing.quantity;
    // A weighed item is held in grams and never comes in packs.
    const weighed = (patch.measure ?? existing.measure) === "WEIGHT";
    const packSize = weighed ? null : patch.packSize === undefined ? existing.packSize : patch.packSize;
    const item = await tx.item.update({
      where: { id },
      data: {
        ...patch,
        ...(weighed ? { unitName: "g", packSize: null } : {}),
        packName: packSize ? patch.packName : null,
        ...(quantityChanged
          ? {
              movements: {
                create: {
                  type: "ADJUST",
                  delta: patch.quantity! - existing.quantity,
                  quantityAfter: patch.quantity!,
                  note: msg("note.edited"),
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
  if (!existing) throw new ApiError(404, msg("error.itemMissing"));
  await prisma.item.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
