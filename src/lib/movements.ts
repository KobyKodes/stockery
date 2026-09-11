import "server-only";
import type { MovementType } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { itemSelect, toItemRow, type ItemRow } from "@/lib/items";
import { prisma } from "@/lib/prisma";
import { syncReorderEntry } from "@/lib/reorder";
import { applyTake, canUndo } from "@/lib/stock";
import { msg } from "@/lib/i18n/message";

// Every change to a quantity goes through here so it always leaves a
// movement behind and keeps the reorder list in step.

export type MovementRow = {
  id: string;
  type: MovementType;
  delta: number;
  quantityAfter: number;
  createdAt: string;
};

export type MovementResult = {
  item: ItemRow;
  movement: MovementRow;
  /** Base units actually removed or added. */
  applied: number;
  /** True when a take asked for more than was on hand and was cut to zero. */
  clamped: boolean;
};

function toMovementRow(m: { id: string; type: MovementType; delta: number; quantityAfter: number; createdAt: Date }): MovementRow {
  return { id: m.id, type: m.type, delta: m.delta, quantityAfter: m.quantityAfter, createdAt: m.createdAt.toISOString() };
}

async function loadQuantity(itemId: string) {
  const item = await prisma.item.findUnique({ where: { id: itemId }, select: { quantity: true, archived: true } });
  if (!item) throw new ApiError(404, msg("error.itemMissing"));
  return item;
}

async function record(itemId: string, type: MovementType, delta: number, note?: string): Promise<{ item: ItemRow; movement: MovementRow }> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.item.findUniqueOrThrow({ where: { id: itemId }, select: { quantity: true } });
    const quantityAfter = Math.max(0, current.quantity + delta);
    const item = await tx.item.update({
      where: { id: itemId },
      data: { quantity: quantityAfter },
      select: itemSelect,
    });
    const movement = await tx.stockMovement.create({
      data: { itemId, type, delta: quantityAfter - current.quantity, quantityAfter, note },
    });
    await syncReorderEntry(itemId, tx);
    return { item: toItemRow(item), movement: toMovementRow(movement) };
  });
}

export async function takeStock(itemId: string, quantity: number): Promise<MovementResult> {
  const current = await loadQuantity(itemId);
  const { taken, clamped } = applyTake(current.quantity, quantity);
  const { item, movement } = await record(itemId, "TAKE", -taken);
  return { item, movement, applied: taken, clamped };
}

export async function receiveStock(itemId: string, quantity: number, note?: string): Promise<MovementResult> {
  await loadQuantity(itemId);
  const { item, movement } = await record(itemId, "RECEIVE", quantity, note);
  return { item, movement, applied: quantity, clamped: false };
}

export async function countStock(itemId: string, counted: number): Promise<MovementResult> {
  const current = await loadQuantity(itemId);
  const delta = counted - current.quantity;
  const { item, movement } = await record(itemId, "COUNT", delta);
  return { item, movement, applied: delta, clamped: false };
}

/** Reverses a movement with an ADJUST. Only the latest movement, only within the window. */
export async function undoMovement(movementId: string): Promise<MovementResult> {
  const movement = await prisma.stockMovement.findUnique({ where: { id: movementId } });
  if (!movement) throw new ApiError(404, msg("error.movementMissing"));
  const latest = await prisma.stockMovement.findFirst({
    where: { itemId: movement.itemId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (!canUndo(movement, latest?.id === movement.id)) {
    throw new ApiError(409, msg("error.undoExpired"));
  }
  const { item, movement: adjust } = await record(movement.itemId, "ADJUST", -movement.delta, "Undo");
  return { item, movement: adjust, applied: -movement.delta, clamped: false };
}
