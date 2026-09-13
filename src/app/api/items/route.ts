import { NextResponse } from "next/server";
import { handle, parseBody, parseQuery } from "@/lib/api";
import { assertAssignableLocation, itemSelect, listItems, toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { syncReorderEntry } from "@/lib/reorder";
import { itemInput, listQuery } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

export const GET = handle(async (request) => {
  const query = parseQuery(new URL(request.url), listQuery);
  const items = await listItems(query);
  return NextResponse.json({ items });
});

export const POST = handle(async (request) => {
  const input = await parseBody(request, itemInput);
  await assertAssignableLocation(input.locationId ?? null);
  const last = await prisma.item.findFirst({
    where: { locationId: input.locationId ?? null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  // A weighed item is held in grams and never comes in packs.
  const weighed = input.measure === "WEIGHT";
  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        locationId: input.locationId ?? null,
        measure: input.measure,
        quantity: input.quantity,
        unitName: weighed ? "g" : input.unitName,
        packSize: weighed ? null : (input.packSize ?? null),
        packName: !weighed && input.packSize ? (input.packName ?? null) : null,
        threshold: input.threshold,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        movements: {
          create: { type: "COUNT", delta: input.quantity, quantityAfter: input.quantity, note: msg("note.added") },
        },
      },
      select: itemSelect,
    });
    await syncReorderEntry(item.id, tx);
    return item;
  });

  return NextResponse.json({ item: toItemRow(created) }, { status: 201 });
});
