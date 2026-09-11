import { NextResponse } from "next/server";
import { ApiError, handle, type RouteContext } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type Ctx = RouteContext<{ id: string }>;

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024; // photos are resized to 512px in the browser first

function etagFor(updatedAt: Date) {
  return `"${updatedAt.getTime().toString(36)}"`;
}

export const GET = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const item = await prisma.item.findUnique({
    where: { id },
    select: { image: true, imageType: true, updatedAt: true },
  });
  if (!item?.image || !item.imageType) throw new ApiError(404, "This item has no photo.");

  const etag = etagFor(item.updatedAt);
  const headers = {
    "Content-Type": item.imageType,
    "Cache-Control": "private, max-age=86400",
    ETag: etag,
  };
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(new Uint8Array(item.image), { headers });
});

export const PUT = handle<Ctx>(async (request, { params }) => {
  const { id } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("image");
  if (!(file instanceof File)) throw new ApiError(400, "Choose a photo to upload.");
  if (!ALLOWED.includes(file.type)) throw new ApiError(400, "The photo must be a JPEG, PNG or WebP.");
  if (file.size > MAX_BYTES) throw new ApiError(400, "The photo must be under 2 MB.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const item = await prisma.item.update({
    where: { id },
    data: { image: bytes, imageType: file.type },
    select: { id: true, updatedAt: true },
  });
  return NextResponse.json({ ok: true, imageVersion: String(item.updatedAt.getTime()) });
});

export const DELETE = handle<Ctx>(async (_request, { params }) => {
  const { id } = await params;
  await prisma.item.update({ where: { id }, data: { image: null, imageType: null } });
  return new Response(null, { status: 204 });
});
