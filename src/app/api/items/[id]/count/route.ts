import { NextResponse } from "next/server";
import { handle, parseBody, type RouteContext } from "@/lib/api";
import { countStock } from "@/lib/movements";
import { countBody } from "@/lib/validation";

export const POST = handle<RouteContext<{ id: string }>>(async (request, { params }) => {
  const { id } = await params;
  const { counted } = await parseBody(request, countBody);
  return NextResponse.json(await countStock(id, counted));
});
