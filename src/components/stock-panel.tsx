"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnline } from "@/components/offline-banner";
import { ItemThumb } from "@/components/item-thumb";
import { QuantityNumeral } from "@/components/quantity-numeral";
import { StockBar } from "@/components/stock-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/fetcher";
import type { ItemRow } from "@/lib/item-view";
import { pluralise } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Mode = "take" | "receive";

type MovementResult = {
  item: ItemRow;
  movement: { id: string; type: string; delta: number; quantityAfter: number; createdAt: string };
  applied: number;
  clamped: boolean;
};

type Notice = { text: string; undoId: string | null };

type Props = {
  item: ItemRow;
  presets: number[];
  /** Called with the fresh row after every change. */
  onChange?: (item: ItemRow) => void;
  /** Hide the name and thumbnail when the surrounding page already shows them. */
  showHeader?: boolean;
  className?: string;
};

const UNDO_VISIBLE_MS = 10_000;

// The daily workflow. One tap on a preset performs the take and the numeral
// rolls; there is no confirm step, only Undo. The same layout serves
// deliveries under the Receive tab.
export function StockPanel({ item: initial, presets, onChange, showHeader = true, className }: Props) {
  const router = useRouter();
  const [item, setItem] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setItem(initial);
  }

  const [mode, setMode] = useState<Mode>("take");
  const [field, setField] = useState("");
  const [inPacks, setInPacks] = useState(false);
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const blocked = busy || !online;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPacks = !!item.packSize && item.packSize > 1 && !!item.packName;
  const packSize = hasPacks ? item.packSize! : 1;
  const fieldNumber = Math.max(0, Math.floor(Number(field) || 0));
  const fieldUnits = inPacks ? fieldNumber * packSize : fieldNumber;

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  function showNotice(text: string, undoId: string | null) {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setNotice({ text, undoId });
    if (undoId) {
      undoTimer.current = setTimeout(() => setNotice((n) => (n?.undoId === undoId ? { ...n, undoId: null } : n)), UNDO_VISIBLE_MS);
    }
  }

  function apply(result: MovementResult) {
    setItem(result.item);
    onChange?.(result.item);
    router.refresh();
  }

  async function act(kind: Mode, quantity: number) {
    if (quantity < 1 || busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<MovementResult>(`/api/items/${item.id}/${kind}`, { method: "POST", body: { quantity } });
      apply(result);
      const left = result.item.quantity;
      if (kind === "take") {
        showNotice(
          result.clamped ? `Only ${result.applied} were left, set to 0.` : `Took ${result.applied}. ${left} left.`,
          result.applied > 0 ? result.movement.id : null,
        );
      } else {
        showNotice(`Received ${result.applied}. ${left} now.`, result.movement.id);
      }
      setField("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function undo(movementId: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<MovementResult>(`/api/movements/${movementId}/undo`, { method: "POST" });
      apply(result);
      showNotice(`Undone. ${result.item.quantity} left.`, null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "That couldn't be undone.");
    } finally {
      setBusy(false);
    }
  }

  // On a keyboard, digits typed anywhere (not in another field) start the
  // amount. Enter then takes, which the form's submit already handles.
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      if (!/^[0-9]$/.test(e.key)) return;
      e.preventDefault();
      setField(e.key);
      fieldRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const sign = mode === "take" ? "-" : "+";
  const presetVariant = mode === "take" ? "primary" : "secondary";
  const verb = mode === "take" ? "Take" : "Receive";
  const unitWord = pluralise(item.unitName, fieldUnits || 2);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p role="status" aria-live="polite" className="flex min-h-6 items-center gap-3 text-base">
        {notice ? (
          <>
            <span>{notice.text}</span>
            {notice.undoId ? (
              <Button variant="link" size="sm" disabled={blocked} onClick={() => void undo(notice.undoId!)}>
                Undo
              </Button>
            ) : null}
          </>
        ) : null}
      </p>

      {showHeader ? (
        <div className="flex items-center gap-3">
          <ItemThumb item={item} size={48} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight">{item.name}</p>
            <p className="truncate text-xs text-stencil-muted">
              {[item.location?.name, item.category?.name].filter(Boolean).join(", ") || pluralise(item.unitName, 2)}
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <QuantityNumeral quantity={item.quantity} status={item.status} size="sheet" />
        <p className="text-base text-stencil-muted">{pluralise(item.unitName, item.quantity)} left</p>
        <StockBar quantity={item.quantity} threshold={item.threshold} status={item.status} className="mt-2" />
      </div>

      <div role="tablist" aria-label="Take or receive" className="flex gap-6 rule-hair pt-1">
        {(["take", "receive"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "h-tap border-b-[3px] text-base font-semibold",
              mode === m ? "border-stencil text-stencil" : "border-transparent text-stencil-muted",
            )}
          >
            {m === "take" ? "Take" : "Receive"}
          </button>
        ))}
      </div>

      <div role="group" aria-label={`${verb} presets`} className="grid grid-cols-4 gap-2 desk:grid-cols-5">
        {presets.map((n) => (
          <Button key={n} variant={presetVariant} disabled={blocked} onClick={() => void act(mode, n)} className="tabular">
            {sign}
            {n}
          </Button>
        ))}
        {hasPacks ? (
          <Button
            variant={presetVariant}
            disabled={blocked}
            onClick={() => void act(mode, packSize)}
            className="col-span-2 tabular desk:col-span-1"
          >
            {sign}1 {item.packName}
          </Button>
        ) : null}
      </div>

      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void act(mode, fieldUnits);
        }}
      >
        <div className="flex gap-2">
          <Input
            ref={fieldRef}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            aria-label={`Amount to ${mode}`}
            placeholder="Amount"
            className="w-28"
            value={field}
            onChange={(e) => setField(e.target.value)}
          />
          {hasPacks ? (
            <div role="group" aria-label="Packs or units" className="flex h-tap rounded-control border border-stencil">
              {[false, true].map((packs) => (
                <button
                  key={String(packs)}
                  type="button"
                  aria-pressed={inPacks === packs}
                  onClick={() => setInPacks(packs)}
                  className={cn("px-3 text-base font-semibold", inPacks === packs ? "bg-stencil text-paper" : "text-stencil")}
                >
                  {packs ? pluralise(item.packName!, 2) : pluralise(item.unitName, 2)}
                </button>
              ))}
            </div>
          ) : null}
          {/* Outlined, so the yellow presets stay the only bright thing here. */}
          <Button type="submit" variant="secondary" disabled={blocked || fieldUnits < 1} className="ml-auto">
            {verb} {fieldUnits > 0 ? fieldUnits : ""}
          </Button>
        </div>
        {hasPacks && inPacks && fieldNumber > 0 ? (
          <p className="text-xs text-stencil-muted tabular">
            {fieldNumber} {pluralise(item.packName!, fieldNumber)} = {fieldUnits} {unitWord}
          </p>
        ) : null}
      </form>

      {error ? (
        <p role="alert" className="border-l-[3px] border-bay-red pl-3 text-base">
          {error}
        </p>
      ) : null}
    </div>
  );
}
