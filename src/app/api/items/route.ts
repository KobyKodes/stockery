import { NextResponse } from "next/server";
import { handle, parseBody, parseQuery } from "@/lib/api";
import { itemSelect, listItems, toItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { syncReorderEntry } from "@/lib/reorder";
import { itemInput, listQuery } from "@/lib/validation";

export const GET = handle(async (request) => {
  const query = parseQuery(new URL(request.url), listQuery);
  const items = await listItems(query);
  return NextResponse.json({ items });
});

export const POST = handle(async (request) => {
  const input = await parseBody(request, itemInput);
  const last = await prisma.item.findFirst({
    where: { locationId: input.locationId ?? null },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const created = await prisma.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        categoryId: input.categoryId ?? null,
        locationId: input.locationId ?? null,
        quantity: input.quantity,
        unitName: input.unitName,
        packSize: input.packSize ?? null,
        packName: input.packSize ? (input.packName ?? null) : null,
        threshold: input.threshold,
        sortOrder: (last?.sortOrder ?? -1) + 1,
        movements: {
          create: { type: "COUNT", delta: input.quantity, quantityAfter: input.quantity, note: "Added to the storeroom" },
        },
      },
      select: itemSelect,
    });
    await syncReorderEntry(item.id, tx);
    return item;
  });

  return NextResponse.json({ item: toItemRow(created) }, { status: 201 });
});
