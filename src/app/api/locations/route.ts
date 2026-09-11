import { NextResponse } from "next/server";
import { ApiError, handle, parseBody } from "@/lib/api";
import { getLocationTree } from "@/lib/locations";
import { prisma } from "@/lib/prisma";
import { locationCreate } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

export const GET = handle(async () => {
  return NextResponse.json({ locations: await getLocationTree() });
});

export const POST = handle(async (request) => {
  const { name, parentId = null } = await parseBody(request, locationCreate);
  if (parentId) {
    const parent = await prisma.location.findUnique({ where: { id: parentId }, select: { id: true } });
    if (!parent) throw new ApiError(404, msg("error.storeMissing"));
  }
  // Names are unique among siblings, so "Shelf A" can live in more than one store.
  const exists = await prisma.location.findFirst({ where: { name, parentId } });
  if (exists) {
    throw new ApiError(409, parentId ? `That store already has a ${name}.` : `There's already a location called ${name}.`);
  }
  const last = await prisma.location.findFirst({
    where: { parentId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const location = await prisma.location.create({
    data: { name, parentId, sortOrder: (last?.sortOrder ?? -1) + 1 },
    select: { id: true, name: true, sortOrder: true, parentId: true },
  });
  return NextResponse.json(location, { status: 201 });
});
