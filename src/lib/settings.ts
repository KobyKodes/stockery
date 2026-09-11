import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_TAKE_PRESETS, normalisePresets } from "@/lib/presets";

const TAKE_PRESETS_KEY = "takePresets";

export async function getTakePresets(): Promise<number[]> {
  const row = await prisma.setting.findUnique({ where: { key: TAKE_PRESETS_KEY } });
  if (!row) return DEFAULT_TAKE_PRESETS;
  return normalisePresets(row.value);
}

export async function setTakePresets(presets: number[]): Promise<number[]> {
  const value = normalisePresets(presets);
  await prisma.setting.upsert({
    where: { key: TAKE_PRESETS_KEY },
    create: { key: TAKE_PRESETS_KEY, value },
    update: { value },
  });
  return value;
}
