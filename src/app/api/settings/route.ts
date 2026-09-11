import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, parseBody } from "@/lib/api";
import { getTakePresets, setTakePresets } from "@/lib/settings";
import { msg } from "@/lib/i18n/message";

const settingsPatch = z.object({
  takePresets: z.array(z.number().int().min(1, msg("error.presetMin"))).min(1, msg("error.presetKeepOne")).max(6),
});

export const GET = handle(async () => {
  return NextResponse.json({ takePresets: await getTakePresets() });
});

export const PATCH = handle(async (request) => {
  const { takePresets } = await parseBody(request, settingsPatch);
  return NextResponse.json({ takePresets: await setTakePresets(takePresets) });
});
