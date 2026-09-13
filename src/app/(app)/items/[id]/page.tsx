/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ar as arDates, enGB } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ItemThumb } from "@/components/item-thumb";
import { StockPanel } from "@/components/stock-panel";
import { getI18n, getT } from "@/lib/i18n/server";
import { itemImageUrl } from "@/lib/image";
import { getItemRow } from "@/lib/items";
import { movementKey } from "@/lib/labels";
import { resolveMessage } from "@/lib/i18n/message";
import { prisma } from "@/lib/prisma";
import { getTakePresets } from "@/lib/settings";
import { formatQuantity, formatWeight, pluralise } from "@/lib/stock";

export async function generateMetadata({ params }: PageProps<"/items/[id]">): Promise<Metadata> {
  const { id } = await params;
  const [t, item] = await Promise.all([
    getT(),
    prisma.item.findUnique({ where: { id }, select: { name: true } }),
  ]);
  return { title: item?.name ?? t("meta.item") };
}

export default async function ItemDetailPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params;
  const [{ locale, t }, item, movements, presets] = await Promise.all([
    getI18n(),
    getItemRow(id),
    prisma.stockMovement.findMany({
      where: { itemId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, delta: true, quantityAfter: true, note: true, createdAt: true },
    }),
    getTakePresets(),
  ]);
  if (!item) notFound();

  // Month names come from date-fns; the 24-hour clock and the digits stay the
  // same in both languages so the column still lines up.
  const dates = locale === "ar" ? arDates : enGB;

  // A weighed item reads in g or kg throughout, and packs don't apply to it.
  const weighed = item.measure === "WEIGHT";
  const show = (n: number) => (weighed ? formatWeight(n, locale) : String(n));

  const facts: [string, string][] = weighed
    ? [
        [t("detail.location"), item.location?.name ?? t("common.unassigned")],
        [t("detail.category"), item.category?.name ?? t("common.none")],
        [t("detail.countedIn"), t("detail.weighed")],
        [t("detail.warnAt"), formatWeight(item.threshold, locale)],
      ]
    : [
        [t("detail.location"), item.location?.name ?? t("common.unassigned")],
        [t("detail.category"), item.category?.name ?? t("common.none")],
        [t("detail.countedIn"), pluralise(item.unitName, 2, locale)],
        [
          t("detail.packs"),
          item.packSize && item.packName
            ? t("detail.packHolds", { pack: item.packName, count: item.packSize })
            : t("detail.noPacks"),
        ],
        [t("detail.warnAt"), `${item.threshold} ${pluralise(item.unitName, item.threshold, locale)}`],
      ];

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl">
            <bdi>{item.name}</bdi>
          </h1>
          {item.description ? <p className="mt-1 max-w-prose text-base text-stencil-muted">{item.description}</p> : null}
        </div>
        <Button variant="secondary" render={<Link href={`/items/${item.id}/edit`} />}>
          {t("detail.editItem")}
        </Button>
      </div>

      <div className="grid gap-8 desk:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="flex flex-col gap-6">
          <StockPanel item={item} presets={presets} showHeader={false} className="max-w-md" />
          <p className="text-base text-stencil-muted">
            {t("stock.onHand", { quantity: formatQuantity(item, locale) })}
          </p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base">
            {facts.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-stencil-muted">{k}</dt>
                <dd>
                  <bdi>{v}</bdi>
                </dd>
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
          {t("detail.history", { count: movements.length })}
        </h2>
        {movements.length === 0 ? (
          <p className="mt-2 text-base text-stencil-muted">{t("detail.noHistory")}</p>
        ) : (
          <table className="mt-2 w-full text-base">
            <thead className="text-start text-xs text-stencil-muted">
              <tr className="rule-hair">
                <th className="py-2 text-start font-semibold">{t("detail.colWhen")}</th>
                <th className="py-2 text-start font-semibold">{t("detail.colWhat")}</th>
                <th className="py-2 text-end font-semibold">{t("detail.colChange")}</th>
                <th className="py-2 text-end font-semibold">{t("detail.colLeft")}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => {
                const key = movementKey(m.type);
                return (
                  <tr key={m.id} className="rule-hair">
                    <td className="py-2 pe-3 whitespace-nowrap text-stencil-muted tabular">
                      {format(m.createdAt, "d MMM, HH:mm", { locale: dates })}
                    </td>
                    <td className="py-2">
                      {key ? t(key) : m.type}
                      {m.note ? (
                        <span className="text-stencil-muted"> {resolveMessage(m.note, t)}</span>
                      ) : null}
                    </td>
                    <td className="py-2 text-end tabular">{m.delta > 0 ? `+${show(m.delta)}` : show(m.delta)}</td>
                    <td className="py-2 text-end font-semibold tabular">{show(m.quantityAfter)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
