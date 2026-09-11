import { NextResponse } from "next/server";
import { handle, parseBody, type RouteContext } from "@/lib/api";
import { takeStock } from "@/lib/movements";
import { quantityBody } from "@/lib/validation";

export const POST = handle<RouteContext<{ id: string }>>(async (request, { params }) => {
  const { id } = await params;
  const { quantity } = await parseBody(request, quantityBody);
  return NextResponse.json(await takeStock(id, quantity));
});
