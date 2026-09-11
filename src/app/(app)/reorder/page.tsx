import type { Metadata } from "next";
import { ReorderList } from "@/components/reorder/reorder-list";
import { prisma } from "@/lib/prisma";
import { listReorder } from "@/lib/reorder";

export const metadata: Metadata = { title: "Reorder" };

export default async function ReorderPage() {
  const [entries, addable] = await Promise.all([
    listReorder(),
    prisma.item.findMany({
      where: { archived: false },
      orderBy: [{ location: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  const toBuy = entries.filter((e) => !e.checked).length;

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Reorder</h1>
        <p className="mt-1 max-w-prose text-base text-stencil-muted">
          {entries.length === 0
            ? "Anything that runs low turns up here by itself."
            : `${toBuy} ${toBuy === 1 ? "item" : "items"} still to buy. Tick a row while you shop, then use Received when the delivery lands.`}
        </p>
      </div>
      <ReorderList entries={entries} addable={addable} />
    </main>
  );
}
