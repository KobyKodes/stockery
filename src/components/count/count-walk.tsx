"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { useI18n, useT } from "@/lib/i18n/client";
import { locationLabel, type ItemRow } from "@/lib/item-view";
import { formatQuantity } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Props = { items: ItemRow[] };

type Staged = Record<string, number>;

type Change = { name: string; from: number; to: number; unitName: string };

// Walking the shelves. Nothing is written until "Finish count", so a walk can
// be abandoned without touching the storeroom. One item per screen on a phone,
// the same rows stacked on desktop.
export function CountWalk({ items }: Props) {
  const router = useRouter();
  const t = useT();
  const [staged, setStaged] = useState<Staged>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [summary, setSummary] = useState<{ counted: number; changes: Change[] } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const current = items[index];
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
        .map((i) => ({ name: i.name, from: i.quantity, to: staged[i.id], unitName: i.unitName })),
    [items, staged],
  );

  function setValue(id: string, value: number) {
    setStaged((s) => ({ ...s, [id]: value }));
  }

  function next() {
    setIndex((i) => Math.min(items.length - 1, i + 1));
    topRef.current?.scrollIntoView({ block: "start" });
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
              {summary.changes.map((c) => (
                <tr key={c.name} className="rule-hair">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 text-end text-stencil-muted tabular">{c.from}</td>
                  <td className="py-2 text-end font-semibold tabular">{c.to}</td>
                  <td className="py-2 text-end tabular">{c.to - c.from > 0 ? `+${c.to - c.from}` : c.to - c.from}</td>
                </tr>
              ))}
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
    <div className="flex flex-col gap-6" ref={topRef}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 rule-hair pt-3">
        <p className="text-base">
          <span className="tabular font-semibold">
            {t("count.position", { index: index + 1, total: items.length })}
          </span>
          <span className="text-stencil-muted">
            {" "}
            {t("count.inLocation", {
              location: locationLabel(current.location) ?? t("common.unassigned"),
            })}
          </span>
        </p>
        <button
          type="button"
          className="text-base font-semibold text-steel underline-offset-4 hover:underline"
          onClick={() => (touched ? setConfirmLeave(true) : router.push("/"))}
        >
          {t("count.stop")}
        </button>
      </div>

      {/* Phone: one item at a time. */}
      <div className="desk:hidden">
        <CountRow item={current} value={staged[current.id] ?? current.quantity} onChange={setValue} big />
        <div className="mt-6 flex gap-3">
          {index < items.length - 1 ? (
            <>
              <Button onClick={next}>{t("count.next")}</Button>
              <Button variant="ghost" onClick={next}>
                {t("count.skip")}
              </Button>
            </>
          ) : null}
          {index === items.length - 1 ? (
            <Button disabled={busy || !online} onClick={() => void finish()}>
              {busy ? t("common.saving") : t("count.finish")}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Desktop: the whole walk as one list. */}
      <div className="hidden desk:block">
        <ul>
          {items.map((item, i) => (
            <li key={item.id} className={cn("rule-hair py-3", i === index && "bg-paper")}>
              <CountRow item={item} value={staged[item.id] ?? item.quantity} onChange={setValue} onFocus={() => setIndex(i)} />
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center gap-3">
          <Button disabled={busy || !online} onClick={() => void finish()}>
            {busy ? t("common.saving") : t("count.finish")}
          </Button>
          <p className="text-base text-stencil-muted">
            {changes.length === 0 ? t("count.nothingChangedYet") : t("count.changed", { count: changes.length })}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-base">
          {error}
        </p>
      ) : null}

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
  onChange,
  onFocus,
  big = false,
}: {
  item: ItemRow;
  value: number;
  onChange: (id: string, value: number) => void;
  onFocus?: () => void;
  big?: boolean;
}) {
  const { locale, t } = useI18n();
  return (
    <div className={cn("flex gap-4", big ? "flex-col" : "items-center")} onFocus={onFocus}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ItemThumb item={item} size={big ? 64 : 40} />
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", big ? "text-lg" : "text-base")}>
            <bdi>{item.name}</bdi>
          </p>
          <p className="truncate text-xs text-stencil-muted">
            {t("count.lastCount", { quantity: formatQuantity(item, locale) })}
            {item.location ? (
              <>
                {locale === "ar" ? "، " : ", "}
                <bdi>{locationLabel(item.location)}</bdi>
              </>
            ) : null}
          </p>
        </div>
      </div>
      {/* On a phone the count field is set in the display face at 28px: it is
          the thing being read off the shelf, so it gets the weight. */}
      <div
        className={cn(
          big
            ? "mt-2 [&_input]:h-14 [&_input]:w-28 [&_input]:font-display [&_input]:text-xl [&_input]:font-bold"
            : // Fixed width with the entry pushed to the inline end, so every
              // row's fields finish on the same edge, packs or no packs.
              "flex w-[24rem] shrink-0 justify-end [&>*]:items-end",
        )}
      >
        <PackEntry
          id={`count-${item.id}`}
          value={value}
          onChange={(v) => onChange(item.id, v)}
          unitName={item.unitName}
          packSize={item.packSize}
          packName={item.packName}
        />
      </div>
    </div>
  );
}
