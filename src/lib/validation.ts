import { z } from "zod";

// Request shapes for every route handler. Messages are written for the
// person reading them in a toast, not for a developer.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((s) => (s.length ? s : null))
    .nullable()
    .optional();

const optionalId = z.string().min(1).nullable().optional();

export const itemInput = z
  .object({
    name: z.string().trim().min(1, "Give the item a name.").max(80, "Keep the name under 80 characters."),
    description: optionalText(200),
    categoryId: optionalId,
    locationId: optionalId,
    quantity: z.number().int("Quantity must be a whole number.").min(0, "Quantity can't be negative."),
    unitName: z.string().trim().min(1, "Say what one of these is called.").max(30),
    packSize: z.number().int().min(2, "A pack holds at least 2.").nullable().optional(),
    packName: optionalText(30),
    threshold: z.number().int("Threshold must be a whole number.").min(0, "Threshold can't be negative."),
  })
  .superRefine((v, ctx) => {
    if (v.packSize && !v.packName) {
      ctx.addIssue({ code: "custom", path: ["packName"], message: "Name the pack (case, box, sleeve)." });
    }
  });
export type ItemInput = z.infer<typeof itemInput>;

export const itemPatch = z
  .object({
    name: z.string().trim().min(1, "Give the item a name.").max(80),
    description: optionalText(200),
    categoryId: optionalId,
    locationId: optionalId,
    quantity: z.number().int().min(0, "Quantity can't be negative."),
    unitName: z.string().trim().min(1).max(30),
    packSize: z.number().int().min(2, "A pack holds at least 2.").nullable(),
    packName: optionalText(30),
    threshold: z.number().int().min(0, "Threshold can't be negative."),
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
  quantity: z.number().int("Use a whole number.").min(1, "Enter at least 1."),
});

export const countBody = z.object({
  counted: z.number().int("Use a whole number.").min(0, "A count can't be negative."),
});

export const reorderIdsBody = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const nameBody = z.object({
  name: z.string().trim().min(1, "Give it a name.").max(40, "Keep the name under 40 characters."),
});

export const namePatch = z
  .object({
    name: z.string().trim().min(1, "Give it a name.").max(40),
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
    requestedQty: z.number().int().min(1, "Order at least 1."),
  })
  .partial();
