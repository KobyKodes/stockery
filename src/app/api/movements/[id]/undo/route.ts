import { NextResponse } from "next/server";
import { handle, type RouteContext } from "@/lib/api";
import { undoMovement } from "@/lib/movements";

export const POST = handle<RouteContext<{ id: string }>>(async (_request, { params }) => {
  const { id } = await params;
  return NextResponse.json(await undoMovement(id));
});
