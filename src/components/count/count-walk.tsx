"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import type { ItemRow } from "@/lib/item-view";
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
  const [staged, setStaged] = useState<Staged>({});
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
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
      setError(e instanceof Error ? e.message : "The count didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-lg">There is nothing to count yet. Add an item first.</p>
        <Button render={<Link href="/items/new" />}>Add your first item</Button>
      </div>
    );
  }

  if (summary) {
    return (
      <section className="flex max-w-prose flex-col gap-6">
        <div>
          <p className="text-lg">
            Counted {summary.counted} {summary.counted === 1 ? "item" : "items"}, {summary.changes.length} changed.
          </p>
          {summary.changes.length === 0 ? (
            <p className="mt-1 text-base text-stencil-muted">Everything matched what the storeroom said.</p>
          ) : null}
        </div>
        {summary.changes.length > 0 ? (
          <table className="w-full text-base">
            <thead className="text-left text-xs text-stencil-muted">
              <tr className="rule-hair">
                <th className="py-2 font-semibold">Item</th>
                <th className="py-2 text-right font-semibold">Was</th>
                <th className="py-2 text-right font-semibold">Now</th>
                <th className="py-2 text-right font-semibold">Change</th>
              </tr>
            </thead>
            <tbody>
              {summary.changes.map((c) => (
                <tr key={c.name} className="rule-hair">
                  <td className="py-2">{c.name}</td>
                  <td className="py-2 text-right text-stencil-muted tabular">{c.from}</td>
                  <td className="py-2 text-right font-semibold tabular">{c.to}</td>
                  <td className="py-2 text-right tabular">{c.to - c.from > 0 ? `+${c.to - c.from}` : c.to - c.from}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div className="flex gap-3">
          <Button render={<Link href="/" />}>Back to the storeroom</Button>
        </div>
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6" ref={topRef}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 rule-hair pt-3">
        <p className="text-base">
          <span className="tabular font-semibold">
            {index + 1} of {items.length}
          </span>
          <span className="text-stencil-muted"> in {current.location?.name ?? "Unassigned"}</span>
        </p>
        <button
          type="button"
          className="text-base font-semibold text-steel underline-offset-4 hover:underline"
          onClick={() => (touched ? setConfirmLeave(true) : router.push("/"))}
        >
          Stop counting
        </button>
      </div>

      {/* Phone: one item at a time. */}
      <div className="desk:hidden">
        <CountRow item={current} value={staged[current.id] ?? current.quantity} onChange={setValue} big />
        <div className="mt-6 flex gap-3">
          {index < items.length - 1 ? (
            <>
              <Button onClick={next}>Next item</Button>
              <Button variant="ghost" onClick={next}>
                Skip
              </Button>
            </>
          ) : null}
          {index === items.length - 1 ? (
            <Button disabled={busy} onClick={() => void finish()}>
              {busy ? "Saving" : "Finish count"}
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
          <Button disabled={busy} onClick={() => void finish()}>
            {busy ? "Saving" : "Finish count"}
          </Button>
          <p className="text-base text-stencil-muted">
            {changes.length === 0 ? "Nothing changed yet." : `${changes.length} ${changes.length === 1 ? "item" : "items"} changed.`}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-base">
          {error}
        </p>
      ) : null}

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop counting?</DialogTitle>
            <DialogDescription>
              {changes.length === 1 ? "One counted item hasn't been saved" : `${changes.length} counted items haven't been saved`} and
              will be discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmLeave(false)}>
              Keep counting
            </Button>
            <Button variant="destructive" onClick={() => router.push("/")}>
              Discard the count
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
  return (
    <div className={cn("flex gap-4", big ? "flex-col" : "items-center")} onFocus={onFocus}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <ItemThumb item={item} size={big ? 64 : 40} />
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", big ? "text-lg" : "text-base")}>{item.name}</p>
          <p className="truncate text-xs text-stencil-muted">
            Last count {formatQuantity(item)}
            {item.location ? `, ${item.location.name}` : ""}
          </p>
        </div>
      </div>
      {/* On a phone the count field is set in the display face at 28px: it is
          the thing being read off the shelf, so it gets the weight. */}
      <div
        className={cn(
          big
            ? "mt-2 [&_input]:h-14 [&_input]:w-28 [&_input]:font-display [&_input]:text-xl [&_input]:font-bold"
            : // Fixed width with the entry pushed right, so every row's fields
              // end on the same edge whether or not the item has packs.
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
