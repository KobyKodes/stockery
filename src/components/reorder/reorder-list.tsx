"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardCopy, Plus, X } from "lucide-react";
import { ItemThumb } from "@/components/item-thumb";
import { useToast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { api } from "@/lib/fetcher";
import type { ItemRow } from "@/lib/item-view";
import { asPlainText, orderAmount, type ReorderRow } from "@/lib/reorder-view";
import { pluralise } from "@/lib/stock";

type Props = {
  entries: ReorderRow[];
  addable: Pick<ItemRow, "id" | "name">[];
};

// The shopping list. Low and out items land here on their own; anything else
// can be added by hand. Ticking a row is for while you shop; Received is what
// puts the delivery into the storeroom.
export function ReorderList({ entries: initial, addable }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [entries, setEntries] = useState(initial);
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) {
    setSeen(initial);
    setEntries(initial);
  }

  const [adding, setAdding] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const qtyTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const toBuy = useMemo(() => entries.filter((e) => !e.checked), [entries]);
  const bought = useMemo(() => entries.filter((e) => e.checked), [entries]);
  const onList = new Set(entries.map((e) => e.item.id));
  const choices = addable.filter((i) => !onList.has(i.id));

  function fail(e: unknown, fallback: string) {
    setError(e instanceof Error ? e.message : fallback);
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setError("");
    try {
      const result = await api<{ entries: ReorderRow[] }>(`/api/reorder/${id}`, { method: "PATCH", body });
      setEntries(result.entries);
      router.refresh();
    } catch (e) {
      fail(e, "That change didn't save.");
    }
  }

  function setQty(id: string, value: number) {
    setEntries((rows) => rows.map((r) => (r.id === id ? { ...r, requestedQty: value } : r)));
    const timers = qtyTimers.current;
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => {
        if (value >= 1) void patch(id, { requestedQty: value });
      }, 400),
    );
  }

  async function add() {
    if (!adding) return;
    setError("");
    try {
      const result = await api<{ entries: ReorderRow[] }>("/api/reorder", { method: "POST", body: { itemId: adding } });
      setEntries(result.entries);
      setAdding("");
      router.refresh();
    } catch (e) {
      fail(e, "That item couldn't be added.");
    }
  }

  async function remove(row: ReorderRow) {
    setBusyId(row.id);
    setError("");
    try {
      const result = await api<{ entries: ReorderRow[] }>(`/api/reorder/${row.id}`, { method: "DELETE" });
      setEntries(result.entries);
      router.refresh();
    } catch (e) {
      fail(e, "That row couldn't be removed.");
    } finally {
      setBusyId(null);
    }
  }

  async function receive(row: ReorderRow) {
    setBusyId(row.id);
    setError("");
    try {
      const result = await api<{ entries: ReorderRow[]; applied: number }>(`/api/reorder/${row.id}/receive`, {
        method: "POST",
      });
      setEntries(result.entries);
      toast(`Received ${result.applied} ${pluralise(row.item.unitName, result.applied)} of ${row.item.name}`);
      router.refresh();
    } catch (e) {
      fail(e, "That delivery didn't save.");
    } finally {
      setBusyId(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(asPlainText(toBuy.length ? toBuy : entries));
      toast("List copied");
    } catch {
      setError("The list couldn't be copied. Select it and copy by hand.");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="flex w-full gap-2 desk:w-auto desk:flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            void add();
          }}
        >
          <NativeSelect
            aria-label="Item to add to the list"
            className="min-w-0 flex-1 desk:max-w-xs"
            value={adding}
            onChange={(e) => setAdding(e.target.value)}
          >
            <option value="">Add an item</option>
            {choices.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" disabled={!adding}>
            <Plus aria-hidden />
            Add item
          </Button>
        </form>
        <Button variant="secondary" disabled={entries.length === 0} onClick={() => void copy()}>
          <ClipboardCopy aria-hidden />
          Copy list
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-start gap-4 py-8">
          <p className="text-lg">Nothing to buy. Items appear here as soon as they run low.</p>
          <Button variant="secondary" render={<Link href="/" />}>
            Back to the storeroom
          </Button>
        </div>
      ) : null}

      {toBuy.length > 0 ? (
        <section aria-labelledby="to-buy">
          <h2 id="to-buy" className="sticky top-[59px] z-10 rule-heavy bg-concrete pt-2 pb-2 font-display text-lg font-bold uppercase leading-display tracking-[0.02em]">
            To buy
          </h2>
          <ul>
            {toBuy.map((row) => (
              <Row
                key={row.id}
                row={row}
                busy={busyId === row.id}
                onCheck={(checked) => void patch(row.id, { checked })}
                onQty={(v) => setQty(row.id, v)}
                onRemove={() => void remove(row)}
                onReceive={() => void receive(row)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {bought.length > 0 ? (
        <section aria-labelledby="bought">
          <h2 id="bought" className="sticky top-[59px] z-10 rule-heavy bg-concrete pt-2 pb-2 font-display text-lg font-bold uppercase leading-display tracking-[0.02em]">
            Bought
          </h2>
          <ul>
            {bought.map((row) => (
              <Row
                key={row.id}
                row={row}
                busy={busyId === row.id}
                onCheck={(checked) => void patch(row.id, { checked })}
                onQty={(v) => setQty(row.id, v)}
                onRemove={() => void remove(row)}
                onReceive={() => void receive(row)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-base">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Row({
  row,
  busy,
  onCheck,
  onQty,
  onRemove,
  onReceive,
}: {
  row: ReorderRow;
  busy: boolean;
  onCheck: (checked: boolean) => void;
  onQty: (value: number) => void;
  onRemove: () => void;
  onReceive: () => void;
}) {
  const { item } = row;
  return (
    <li className="rule-hair py-2">
      {/* Phone: two lines, name above the amount and the actions. Desktop:
          one row, so the amounts line up down the list. */}
      <div className="flex flex-col gap-2 desk:min-h-row desk:flex-row desk:items-center desk:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Checkbox
            checked={row.checked}
            onCheckedChange={(v) => onCheck(Boolean(v))}
            aria-label={`Mark ${item.name} as bought`}
          />
          <ItemThumb item={item} size={40} />
          <div className="min-w-0 flex-1">
            <Link href={`/items/${item.id}`} className="block truncate text-base font-semibold hover:underline">
              {item.name}
            </Link>
            <p className="truncate text-xs text-stencil-muted">
              {item.quantity} {pluralise(item.unitName, item.quantity)} left
              {row.addedAuto ? "" : ", added by hand"}
            </p>
            {/* On a phone there is no room beside the field, so the pack
                wording sits under the name instead. */}
            <p className="truncate text-xs text-stencil-muted desk:hidden">Order {orderAmount(row)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-11 desk:pl-0">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            className="w-24 shrink-0"
            aria-label={`Amount to order of ${item.name}`}
            value={row.requestedQty}
            onChange={(e) => onQty(Math.max(0, Math.floor(Number(e.target.value))))}
            onFocus={(e) => e.currentTarget.select()}
          />
          <span className="hidden w-40 shrink-0 truncate text-xs text-stencil-muted desk:block">{orderAmount(row)}</span>
          {/* Yellow only once a row is ticked, so the colour points at the
              rows whose delivery you are actually expecting. */}
          <Button
            size="sm"
            variant={row.checked ? "primary" : "secondary"}
            disabled={busy}
            onClick={onReceive}
            className="h-tap desk:h-9"
          >
            Received
          </Button>
          <Button
            size="icon"
            variant="ghost"
            disabled={busy}
            aria-label={`Take ${item.name} off the list`}
            onClick={onRemove}
            className="desk:size-9"
          >
            <X aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}
