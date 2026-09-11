import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { getTakePresets, setTakePresets } from "@/lib/settings";

const settingsPatch = z.object({
  takePresets: z.array(z.number().int().min(1, "Presets must be 1 or more.")).min(1, "Keep at least one preset.").max(6),
});

export const GET = handle(async () => {
  return NextResponse.json({ takePresets: await getTakePresets() });
});

export const PATCH = handle(async (request) => {
  const { takePresets } = await parseBody(request, settingsPatch);
  return NextResponse.json({ takePresets: await setTakePresets(takePresets) });
});
