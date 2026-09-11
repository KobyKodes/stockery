import { NextResponse } from "next/server";
import { ApiError, handle, parseBody, type RouteContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { namePatch } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

export const PATCH = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const patch = await parseBody(request, namePatch);
  if (patch.name) {
    const clash = await prisma.category.findFirst({ where: { name: patch.name, NOT: { id } } });
    if (clash) throw new ApiError(409, `There's already a category called ${patch.name}.`);
  }
  const category = await prisma.category.update({
    where: { id },
    data: patch,
    select: { id: true, name: true, sortOrder: true },
  });
  return NextResponse.json(category);
});

// Items keep existing; their category is set to null by the schema.
export const DELETE = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  await prisma.category.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
