import { NextResponse } from "next/server";
import { ApiError, handle, parseBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { nameBody } from "@/lib/validation";

export const GET = handle(async () => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true, _count: { select: { items: true } } },
  });
  return NextResponse.json({
    categories: categories.map((c) => ({ id: c.id, name: c.name, sortOrder: c.sortOrder, itemCount: c._count.items })),
  });
});

export const POST = handle(async (request) => {
  const { name } = await parseBody(request, nameBody);
  const exists = await prisma.category.findUnique({ where: { name } });
  if (exists) throw new ApiError(409, `There's already a category called ${name}.`);
  const last = await prisma.category.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
  const category = await prisma.category.create({
    data: { name, sortOrder: (last?.sortOrder ?? -1) + 1 },
    select: { id: true, name: true, sortOrder: true },
  });
  return NextResponse.json(category, { status: 201 });
});
