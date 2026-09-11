import { NextResponse } from "next/server";
import { ApiError, handle, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { nameBody } from "@/lib/validation";

export const GET = handle(async () => {
  const locations = await prisma.location.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true, _count: { select: { items: true } } },
  });
  return NextResponse.json({
    locations: locations.map((l) => ({ id: l.id, name: l.name, sortOrder: l.sortOrder, itemCount: l._count.items })),
  });
});

export const POST = handle(async (request) => {
  const { name } = await parseBody(request, nameBody);
  const exists = await prisma.location.findUnique({ where: { name } });
  if (exists) throw new ApiError(409, `There's already a location called ${name}.`);
  const last = await prisma.location.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const location = await prisma.location.create({
    data: { name, sortOrder: (last?.sortOrder ?? -1) + 1 },
    select: { id: true, name: true, sortOrder: true },
  });
  return NextResponse.json(location, { status: 201 });
});
