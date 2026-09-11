import { NextResponse } from "next/server";
import { handle, parseBody, type RouteContext } from "@/lib/api";
import { listReorder } from "@/lib/reorder";
import { prisma } from "@/lib/prisma";
import { reorderPatch } from "@/lib/validation";

type Ctx = RouteContext<{ id: string }>;

export const PATCH = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const patch = await parseBody(request, reorderPatch);
  await prisma.reorderEntry.update({ where: { id }, data: patch });
  return NextResponse.json({ entries: await listReorder() });
});

// Removing by hand keeps the item's stock untouched.
export const DELETE = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  await prisma.reorderEntry.delete({ where: { id } });
  return NextResponse.json({ entries: await listReorder() });
});
