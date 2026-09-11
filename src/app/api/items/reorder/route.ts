import { NextResponse } from "next/server";
import { handle, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { reorderIdsBody } from "@/lib/validation";

// Manual order of items within a location. The ids arrive in the order the
// client dragged them into; sortOrder is rewritten to match.
export const POST = handle(async (request) => {
  const { orderedIds } = await parseBody(request, reorderIdsBody);
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.item.update({ where: { id }, data: { sortOrder: index } })),
  );
  return NextResponse.json({ ok: true });
});
