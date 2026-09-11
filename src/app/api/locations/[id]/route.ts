import { NextResponse } from "next/server";
import { ApiError, handle, parseBody, type RouteContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { namePatch } from "@/lib/validation";
import { msg } from "@/lib/i18n/message";

type Ctx = RouteContext<{ id: string }>;

export const PATCH = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const patch = await parseBody(request, namePatch);
  if (patch.name) {
    const current = await prisma.location.findUnique({ where: { id }, select: { parentId: true } });
    if (!current) throw new ApiError(404, msg("error.locationMissing"));
    const clash = await prisma.location.findFirst({
      where: { name: patch.name, parentId: current.parentId, NOT: { id } },
    });
    if (clash) {
      throw new ApiError(
        409,
        current.parentId ? `That store already has a ${patch.name}.` : `There's already a location called ${patch.name}.`,
      );
    }
  }
  const location = await prisma.location.update({
    where: { id },
    data: patch,
    select: { id: true, name: true, sortOrder: true, parentId: true },
  });
  return NextResponse.json(location);
});

// A store with shelves can't be deleted until its shelves are gone. Otherwise
// items keep existing and move to "Unassigned" (locationId is set null).
export const DELETE = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  const children = await prisma.location.count({ where: { parentId: id } });
  if (children > 0) throw new ApiError(409, msg("error.shelvesFirst"));
  await prisma.location.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
