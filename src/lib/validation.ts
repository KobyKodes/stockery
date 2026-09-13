import { z } from "zod";
import { msg } from "@/lib/i18n/message";

// Request shapes for every route handler. Messages are written for the
// person reading them in a toast, not for a developer.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, msg("error.tooLong", { max }))
    .transform((s) => (s.length ? s : null))
    .nullable()
    .optional();

const optionalId = z.string().min(1).nullable().optional();

const measure = z.enum(["COUNT", "WEIGHT"]);

export const itemInput = z
  .object({
    name: z.string().trim().min(1, msg("error.itemName")).max(80, msg("error.nameMax80")),
    description: optionalText(200),
    categoryId: optionalId,
    locationId: optionalId,
    measure: measure.default("COUNT"),
    quantity: z.number().int(msg("error.quantityWhole")).min(0, msg("error.quantityNegative")),
    unitName: z.string().trim().min(1, msg("error.unitName")).max(30),
    packSize: z.number().int().min(2, msg("error.packMin")).nullable().optional(),
    packName: optionalText(30),
    threshold: z.number().int(msg("error.thresholdWhole")).min(0, msg("error.thresholdNegative")),
  })
  .superRefine((v, ctx) => {
    if (v.measure === "COUNT" && v.packSize && !v.packName) {
      ctx.addIssue({ code: "custom", path: ["packName"], message: msg("error.packName") });
    }
  });
export type ItemInput = z.infer<typeof itemInput>;

export const itemPatch = z
  .object({
    name: z.string().trim().min(1, msg("error.itemName")).max(80),
    description: optionalText(200),
    categoryId: optionalId,
    locationId: optionalId,
    measure,
    quantity: z.number().int().min(0, msg("error.quantityNegative")),
    unitName: z.string().trim().min(1).max(30),
    packSize: z.number().int().min(2, msg("error.packMin")).nullable(),
    packName: optionalText(30),
    threshold: z.number().int().min(0, msg("error.thresholdNegative")),
    sortOrder: z.number().int().min(0),
    archived: z.boolean(),
  })
  .partial();
export type ItemPatch = z.infer<typeof itemPatch>;

export const listQuery = z.object({
  location: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["all", "low", "out"]).optional(),
  q: z.string().trim().max(80).optional(),
});
export type ListQuery = z.infer<typeof listQuery>;

export const quantityBody = z.object({
  quantity: z.number().int(msg("error.whole")).min(1, msg("error.atLeastOne")),
});

export const orderedBody = z.object({
  ordered: z.boolean(),
});

export const countBody = z.object({
  counted: z.number().int(msg("error.whole")).min(0, msg("error.countNegative")),
});

export const reorderIdsBody = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const nameBody = z.object({
  name: z.string().trim().min(1, msg("error.name")).max(40, msg("error.nameMax40")),
});

// Locations may be created inside a store; parentId names that store.
export const locationCreate = z.object({
  name: z.string().trim().min(1, msg("error.name")).max(40, msg("error.nameMax40")),
  parentId: z.string().min(1).nullable().optional(),
});

export const namePatch = z
  .object({
    name: z.string().trim().min(1, msg("error.name")).max(40),
    sortOrder: z.number().int().min(0),
  })
  .partial();

export const reorderAddBody = z.object({
  itemId: z.string().min(1),
  requestedQty: z.number().int().min(1).optional(),
});

export const reorderPatch = z
  .object({
    checked: z.boolean(),
    requestedQty: z.number().int().min(1, msg("error.orderAtLeastOne")),
  })
  .partial();
