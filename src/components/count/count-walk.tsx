"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOnline } from "@/components/offline-banner";
import { ItemThumb } from "@/components/item-thumb";
import { PackEntry } from "@/components/pack-entry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n/client";
import { locationLabel, type ItemRow } from "@/lib/item-view";
import { formatQuantity, formatWeight, type Measure } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Props = { items: ItemRow[] };

type Staged = Record<string, number>;

type Change = { name: string; from: number; to: number; unitName: string; measure: Measure };

type Shelf = { key: string; name: string; items: ItemRow[] };

// Walking the shelves. Nothing is written until "Finish count", so a walk can
// be abandoned without touching the storeroom. The whole walk is one list on
// every screen, grouped by location in walk order. On a phone each row stacks
// the name over its field and Finish stays pinned above the tab bar.
export function CountWalk({ items }: Props) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [staged, setStaged] = useState<Staged>({});
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [summary, setSummary] = useState<{ counted: number; changes: Change[] } | null>(null);

  const touched = Object.keys(staged).length > 0;

  // Warn before a reload or a tab close while values are staged.
  useEffect(() => {
    if (!touched || summary) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [touched, summary]);

  const changes = useMemo(
    () =>
      items
        .filter((i) => staged[i.id] !== undefined && staged[i.id] !== i.quantity)
        .map((i) => ({ name: i.name, from: i.quantity, to: staged[i.id], unitName: i.unitName, measure: i.measure })),
    [items, staged],
  );

  // Items already arrive in walk order, so consecutive runs share a location.
  const shelves = useMemo(() => {
    const byKey = new Map<string, Shelf>();
    for (const item of items) {
      const key = item.location?.id ?? "none";
      const shelf = byKey.get(key) ?? {
        key,
        name: locationLabel(item.location) ?? t("common.unassigned"),
        items: [],
      };
      shelf.items.push(item);
      byKey.set(key, shelf);
    }
    return [...byKey.values()];
  }, [items, t]);

  function setValue(id: string, value: number) {
    setStaged((s) => ({ ...s, [id]: value }));
  }

  async function finish() {
    setBusy(true);
    setError("");
    try {
      for (const item of items) {
        const value = staged[item.id];
        if (value === undefined || value === item.quantity) continue;
        await api(`/api/items/${item.id}/count`, { method: "POST", body: { counted: value } });
      }
      setSummary({ counted: Object.keys(staged).length, changes });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("count.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-lg">{t("count.nothingToCount")}</p>
        <Button render={<Link href="/items/new" />}>{t("storeroom.addFirstItem")}</Button>
      </div>
    );
  }

  if (summary) {
    return (
      <section className="flex max-w-prose flex-col gap-6">
        <div>
          <p className="text-lg">
            {t("count.summary", { count: summary.counted, changed: summary.changes.length })}
          </p>
          {summary.changes.length === 0 ? (
            <p className="mt-1 text-base text-stencil-muted">{t("count.allMatched")}</p>
          ) : null}
        </div>
        {summary.changes.length > 0 ? (
          <table className="w-full text-base">
            <thead className="text-start text-xs text-stencil-muted">
              <tr className="rule-hair">
                <th className="py-2 text-start font-semibold">{t("count.colItem")}</th>
                <th className="py-2 text-end font-semibold">{t("count.colWas")}</th>
                <th className="py-2 text-end font-semibold">{t("count.colNow")}</th>
                <th className="py-2 text-end font-semibold">{t("count.colChange")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.changes.map((c) => {
                // Weights read in g or kg; counts stay bare numbers, as before.
                const show = (n: number) => (c.measure === "WEIGHT" ? formatWeight(n, locale) : n);
                const diff = c.to - c.from;
                return (
                  <tr key={c.name} className="rule-hair">
                    <td className="py-2">{c.name}</td>
                    <td className="py-2 text-end text-stencil-muted tabular">{show(c.from)}</td>
                    <td className="py-2 text-end font-semibold tabular">{show(c.to)}</td>
                    <td className="py-2 text-end tabular">{diff > 0 ? `+${show(diff)}` : show(diff)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        <div className="flex gap-3">
          <Button render={<Link href="/" />}>{t("common.backToStoreroom")}</Button>
        </div>
      </section>
    );
  }

  return (
    // Room at the bottom on a phone so the last row clears the pinned bar.
    <div className="flex flex-col gap-6 pb-20 desk:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2 rule-hair pt-3">
        <p className="text-base tabular">{t("common.itemCount", { count: items.length })}</p>
        <button
          type="button"
          className="text-base font-semibold text-steel underline-offset-4 hover:underline"
          onClick={() => (touched ? setConfirmLeave(true) : router.push("/"))}
        >
          {t("count.stop")}
        </button>
      </div>

      {shelves.map((shelf) => (
        <section key={shelf.key} aria-labelledby={`shelf-${shelf.key}`}>
          <h2
            id={`shelf-${shelf.key}`}
            className="sticky top-[59px] z-10 rule-heavy bg-concrete pt-2 pb-2 font-display text-lg font-bold uppercase leading-display tracking-[0.02em]"
          >
            <bdi>{shelf.name}</bdi>
          </h2>
          <ul>
            {shelf.items.map((item) => {
              const value = staged[item.id] ?? item.quantity;
              return (
                <li key={item.id} className="rule-hair py-3">
                  <CountRow item={item} value={value} changed={value !== item.quantity} onChange={setValue} />
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-base">
          {error}
        </p>
      ) : null}

      {/* Phone: pinned above the tab bar so Finish is always one tap away.
          Desktop: sits at the end of the list. */}
      <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t border-rule-soft bg-concrete px-4 py-3 desk:static desk:border-0 desk:bg-transparent desk:p-0">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 desk:justify-start">
          <p className="text-base text-stencil-muted desk:order-last">
            {changes.length === 0 ? t("count.nothingChangedYet") : t("count.changed", { count: changes.length })}
          </p>
          <Button disabled={busy || !online} onClick={() => void finish()}>
            {busy ? t("common.saving") : t("count.finish")}
          </Button>
        </div>
      </div>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("count.stopTitle")}</DialogTitle>
            <DialogDescription>{t("count.stopBody", { count: changes.length })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
              {t("count.keepCounting")}
            </Button>
            <Button variant="destructive" onClick={() => router.push("/")}>
              {t("count.discard")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CountRow({
  item,
  value,
  changed,
  onChange,
}: {
  item: ItemRow;
  value: number;
  changed: boolean;
  onChange: (id: string, value: number) => void;
}) {
  const { locale, t } = useI18n();
  return (
    <div className="flex flex-col gap-2 desk:flex-row desk:items-center desk:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ItemThumb item={item} size={40} />
        <div className="min-w-0">
          <p className="flex min-w-0 items-baseline gap-2 text-base font-semibold">
            <bdi className="truncate">{item.name}</bdi>
            {changed ? <span className="shrink-0 text-xs font-semibold text-steel">{t("count.changedMark")}</span> : null}
          </p>
          <p className="truncate text-xs text-stencil-muted">
            {t("count.lastCount", { quantity: formatQuantity(item, locale) })}
          </p>
        </div>
      </div>
      {/* Phone: the field sits under the name, lined up with the text rather
          than the thumbnail, in the display face so it reads at arm's length.
          Desktop: a fixed-width column so every row's fields finish on the
          same edge, packs or no packs. */}
      <div
        className={cn(
          "ps-[52px] [&_input]:font-display [&_input]:text-xl [&_input]:font-bold",
          "desk:flex desk:w-[24rem] desk:shrink-0 desk:justify-end desk:ps-0 desk:[&_input]:font-body desk:[&_input]:text-base desk:[&_input]:font-normal desk:[&>*]:items-end",
        )}
      >
        <PackEntry
          id={`count-${item.id}`}
          value={value}
          onChange={(v) => onChange(item.id, v)}
          unitName={item.unitName}
          packSize={item.packSize}
          packName={item.packName}
          measure={item.measure}
        />
      </div>
    </div>
  );
}
