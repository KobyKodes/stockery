"use client";

import { useEffect, useRef, useState } from "react";
import { Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOnline } from "@/components/offline-banner";
import { ItemThumb } from "@/components/item-thumb";
import { OrderedTag } from "@/components/ordered-tag";
import { QuantityNumeral } from "@/components/quantity-numeral";
import { StockBar } from "@/components/stock-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WeightUnitToggle } from "@/components/weight-entry";
import { api } from "@/lib/fetcher";
import { useI18n } from "@/lib/i18n/client";
import type { ItemRow } from "@/lib/item-view";
import { WEIGHT_PRESETS } from "@/lib/presets";
import { formatWeight, pluralise, toGrams, type WeightUnit } from "@/lib/stock";
import { cn } from "@/lib/utils";

export type StockMode = "take" | "receive";
type Mode = StockMode;

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
  /** Which tab the panel opens on. */
  mode?: StockMode;
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
export function StockPanel({ item: initial, presets, mode: initialMode = "take", onChange, showHeader = true, className }: Props) {
  const router = useRouter();
  const { locale, t } = useI18n();
  const [item, setItem] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setItem(initial);
  }

  const [mode, setMode] = useState<Mode>(initialMode);
  const [field, setField] = useState("");
  const [inPacks, setInPacks] = useState(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>("g");
  const [busy, setBusy] = useState(false);
  const online = useOnline();
  const blocked = busy || !online;
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState("");
  const fieldRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A weighed item takes and receives in grams, with its own gram presets.
  const weighed = item.measure === "WEIGHT";
  const hasPacks = !weighed && !!item.packSize && item.packSize > 1 && !!item.packName;
  const packSize = hasPacks ? item.packSize! : 1;
  // Full packs currently in stock, e.g. 15 rolls out of 1,500 bags.
  const packsInStock = hasPacks ? Math.floor(item.quantity / packSize) : 0;
  const fieldNumber = Math.max(0, Math.floor(Number(field) || 0));
  const fieldUnits = weighed ? toGrams(Number(field), weightUnit) : inPacks ? fieldNumber * packSize : fieldNumber;
  const amount = (n: number) => (weighed ? formatWeight(n, locale) : n);

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
          result.clamped
            ? t(weighed ? "stock.tookClampedWeight" : "stock.tookClamped", { count: amount(result.applied) })
            : t("stock.took", { count: amount(result.applied), left: amount(left) }),
          result.applied > 0 ? result.movement.id : null,
        );
      } else {
        showNotice(t("stock.received", { count: amount(result.applied), left: amount(left) }), result.movement.id);
      }
      setField("");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("stock.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  // Ordered: more is on the way. Marking takes the item off the reorder list.
  async function setOrdered(ordered: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ item: ItemRow }>(`/api/items/${item.id}/ordered`, {
        method: "POST",
        body: { ordered },
      });
      setItem(result.item);
      onChange?.(result.item);
      router.refresh();
      showNotice(ordered ? t("stock.markedOrdered") : t("stock.clearedOrdered"), null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("stock.saveFailed"));
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
      showNotice(t("stock.undone", { count: amount(result.item.quantity) }), null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("stock.undoFailed"));
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
  const verb = mode === "take" ? t("stock.take") : t("stock.receive");
  const unitWord = pluralise(item.unitName, fieldUnits || 2, locale);
  const quick = weighed ? WEIGHT_PRESETS : presets;
  // The quick buttons follow the packs/units switch: with packs selected, +1 is
  // one whole pack. Weighed items keep their gram presets whatever the switch.
  const presetInPacks = hasPacks && inPacks;
  const presetUnits = (n: number) => (presetInPacks ? n * packSize : n);
  const presetWord = (n: number) =>
    presetInPacks ? pluralise(item.packName!, n, locale) : pluralise(item.unitName, n, locale);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <p role="status" aria-live="polite" className="flex min-h-6 items-center gap-3 text-base">
        {notice ? (
          <>
            <span>{notice.text}</span>
            {notice.undoId ? (
              <Button variant="link" size="sm" disabled={blocked} onClick={() => void undo(notice.undoId!)}>
                {t("stock.undo")}
              </Button>
            ) : null}
          </>
        ) : null}
      </p>

      {showHeader ? (
        <div className="flex items-center gap-3">
          <ItemThumb item={item} size={48} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight">
              <bdi>{item.name}</bdi>
            </p>
            <p className="truncate text-xs text-stencil-muted">
              <bdi>
                {[item.location?.name, item.category?.name].filter(Boolean).join(locale === "ar" ? "، " : ", ") ||
                  pluralise(item.unitName, 2, locale)}
              </bdi>
            </p>
          </div>
        </div>
      ) : null}

      <div>
        <QuantityNumeral
          quantity={item.quantity}
          status={item.status}
          size="sheet"
          unitName={item.unitName}
          packSize={item.packSize}
          packName={item.packName}
          measure={item.measure}
        />
        {/* The pack display already spells out the individual count, and a
            weight carries its symbol, so the "left" subtitle only helps when
            there is neither. */}
        {(hasPacks && packsInStock >= 1) || weighed ? null : (
          <p className="text-base text-stencil-muted">
            {t("stock.left", { unit: pluralise(item.unitName, item.quantity, locale) })}
          </p>
        )}
        <StockBar quantity={item.quantity} threshold={item.threshold} status={item.status} className="mt-2" />
      </div>

      {item.orderedAt ? (
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1">
          <OrderedTag />
          <span className="text-base text-stencil-muted">{t("stock.orderedNote")}</span>
          <Button variant="link" size="sm" disabled={blocked} onClick={() => void setOrdered(false)} className="ms-auto">
            {t("stock.clearOrdered")}
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          disabled={blocked}
          onClick={() => void setOrdered(true)}
          className="-ms-3 self-start text-steel"
        >
          <Truck aria-hidden className="rtl:-scale-x-100" />
          {t("stock.markOrdered")}
        </Button>
      )}

      <div role="tablist" aria-label={t("stock.tabs")} className="flex gap-6 rule-hair pt-1">
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
            {m === "take" ? t("stock.take") : t("stock.receive")}
          </button>
        ))}
      </div>

      <div role="group" aria-label={t("stock.presets", { verb })} className={cn("grid gap-2", weighed ? "grid-cols-3" : "grid-cols-4 desk:grid-cols-5")}
      >
        {quick.map((n) => (
          <Button
            key={n}
            variant={presetVariant}
            disabled={blocked}
            onClick={() => void act(mode, presetUnits(n))}
            aria-label={weighed ? undefined : `${verb} ${n} ${presetWord(n)}`}
            className="tabular"
          >
            {sign}
            {amount(n)}
          </Button>
        ))}
        {/* With packs selected, +1 already is one pack. */}
        {hasPacks && !inPacks ? (
          <Button
            variant={presetVariant}
            disabled={blocked}
            onClick={() => void act(mode, packSize)}
            className="col-span-2 tabular desk:col-span-1"
          >
            {sign}
            {t("stock.onePack", { pack: item.packName })}
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
            inputMode={weighed ? "decimal" : "numeric"}
            min={weighed ? 0 : 1}
            step={weighed ? "any" : 1}
            aria-label={t("stock.amountTo", { verb })}
            placeholder={t("common.amount")}
            className="w-28"
            value={field}
            onChange={(e) => setField(e.target.value)}
          />
          {weighed ? <WeightUnitToggle unit={weightUnit} onChange={setWeightUnit} /> : null}
          {hasPacks ? (
            <div role="group" aria-label={t("stock.packsOrUnits")} className="flex h-tap rounded-control border border-stencil">
              {[false, true].map((packs) => (
                <button
                  key={String(packs)}
                  type="button"
                  aria-pressed={inPacks === packs}
                  onClick={() => setInPacks(packs)}
                  className={cn("px-3 text-base font-semibold", inPacks === packs ? "bg-stencil text-paper" : "text-stencil")}
                >
                  {packs ? pluralise(item.packName!, 2, locale) : pluralise(item.unitName, 2, locale)}
                </button>
              ))}
            </div>
          ) : null}
          {/* Outlined, so the yellow presets stay the only bright thing here. */}
          <Button type="submit" variant="secondary" disabled={blocked || fieldUnits < 1} className="ms-auto">
            {verb} {fieldUnits > 0 ? amount(fieldUnits) : ""}
          </Button>
        </div>
        {hasPacks && inPacks && fieldNumber > 0 ? (
          <p className="text-xs text-stencil-muted tabular">
            {t("stock.packEquals", {
              packs: fieldNumber,
              packUnit: pluralise(item.packName!, fieldNumber, locale),
              units: fieldUnits,
              unit: unitWord,
            })}
          </p>
        ) : null}
      </form>

      {error ? (
        <p role="alert" className="border-s-[3px] border-bay-red ps-3 text-base">
          {error}
        </p>
      ) : null}
    </div>
  );
}
