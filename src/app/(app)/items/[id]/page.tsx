/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ItemThumb } from "@/components/item-thumb";
import { QuantityNumeral } from "@/components/quantity-numeral";
import { StockBar } from "@/components/stock-bar";
import { itemImageUrl } from "@/lib/image";
import { getItemRow } from "@/lib/items";
import { movementLabel } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { formatQuantity, pluralise } from "@/lib/stock";

export async function generateMetadata({ params }: PageProps<"/items/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = await prisma.item.findUnique({ where: { id }, select: { name: true } });
  return { title: item?.name ?? "Item" };
}

export default async function ItemDetailPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const [item, movements] = await Promise.all([
    getItemRow(id),
    prisma.stockMovement.findMany({
      where: { itemId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, delta: true, quantityAfter: true, note: true, createdAt: true },
    }),
  ]);
  if (!item) notFound();

  const facts: [string, string][] = [
    ["Location", item.location?.name ?? "Unassigned"],
    ["Category", item.category?.name ?? "None"],
    ["Counted in", pluralise(item.unitName, 2)],
    ["Packs", item.packSize && item.packName ? `1 ${item.packName} holds ${item.packSize}` : "Not sold in packs"],
    ["Warn when down to", `${item.threshold} ${pluralise(item.unitName, item.threshold)}`],
  ];

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl">{item.name}</h1>
          {item.description ? <p className="mt-1 max-w-prose text-base text-stencil-muted">{item.description}</p> : null}
        </div>
        <Button variant="secondary" render={<Link href={`/items/${item.id}/edit`} />}>
          Edit item
        </Button>
      </div>

      <div className="grid gap-8 desk:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-6">
          <div>
            <QuantityNumeral quantity={item.quantity} status={item.status} size="sheet" />
            <p className="mt-1 text-base text-stencil-muted">{formatQuantity(item)} on hand</p>
            <StockBar quantity={item.quantity} threshold={item.threshold} status={item.status} className="mt-2 max-w-xs" />
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-stencil-muted">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <aside>
          {item.hasImage ? (
            <img src={itemImageUrl(item.id, item.imageVersion)} alt={item.name} className="w-full max-w-xs bg-paper object-cover" />
          ) : (
            <ItemThumb item={item} size={160} />
          )}
        </aside>
      </div>

      <section aria-labelledby="history">
        <h2 id="history" className="rule-heavy pt-3 text-lg">
          Last {movements.length} {movements.length === 1 ? "change" : "changes"}
        </h2>
        {movements.length === 0 ? (
          <p className="mt-2 text-base text-stencil-muted">No changes yet.</p>
        ) : (
          <table className="mt-2 w-full text-base">
            <thead className="text-left text-xs text-stencil-muted">
              <tr className="rule-hair">
                <th className="py-2 font-semibold">When</th>
                <th className="py-2 font-semibold">What</th>
                <th className="py-2 text-right font-semibold">Change</th>
                <th className="py-2 text-right font-semibold">Left</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="rule-hair">
                  <td className="py-2 pr-3 whitespace-nowrap text-stencil-muted tabular">{format(m.createdAt, "d MMM, HH:mm")}</td>
                  <td className="py-2">
                    {movementLabel[m.type] ?? m.type}
                    {m.note ? <span className="text-stencil-muted"> {m.note}</span> : null}
                  </td>
                  <td className="py-2 text-right tabular">{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                  <td className="py-2 text-right font-semibold tabular">{m.quantityAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
