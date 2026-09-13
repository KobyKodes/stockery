"use client";

import { RollingNumber } from "@/components/rolling-number";
import { useI18n } from "@/lib/i18n/client";
import { statusKey } from "@/lib/labels";
import { formatWeightValue, pluralise, weightSymbol, weightUnitFor, type Measure, type StockStatus } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Props = {
  quantity: number;
  status: StockStatus;
  size?: "row" | "sheet";
  className?: string;
  // Pass a pack size and name to lead with the pack count — "2 cases or 12
  // gallons". Without them (or with fewer than one full pack in stock) the
  // individual count is the single number.
  unitName?: string;
  packSize?: number | null;
  packName?: string | null;
  // A weighed item shows grams, or kilograms from a kilo up, with the symbol.
  measure?: Measure;
};

// The stock figure. On a packed item the pack count leads, then "or", then the
// loose individual count — the same phrasing in a list row and in the take
// sheet, only the type sizes differ. Digits roll to a new value on a change.
export function QuantityNumeral({ quantity, status, size = "row", className, unitName, packSize, packName, measure }: Props) {
  const { locale, t } = useI18n();
  const key = statusKey(status);
  const word = key ? t(key) : "";

  const statusInk = cn(
    status === "ok" && "text-status-ok-ink",
    status === "low" && "text-status-low-ink",
    status === "out" && "text-status-out-ink",
  );

  if (measure === "WEIGHT") {
    const unit = weightUnitFor(quantity);
    const number = (
      <RollingNumber
        value={quantity}
        format={(n) => formatWeightValue(n, unit)}
        className={cn("numeral", size === "sheet" ? "text-3xl" : "text-xl", statusInk)}
      />
    );
    const symbol = <bdi>{weightSymbol(unit, locale)}</bdi>;
    if (size === "sheet") {
      return (
        <span className={cn("inline-flex items-baseline gap-2", className)}>
          <span className="inline-flex items-baseline gap-1">
            {number}
            <span className="text-base font-semibold text-stencil">{symbol}</span>
          </span>
          <span className="w-10 rtl:w-16 text-xs font-semibold text-stencil">{word}</span>
        </span>
      );
    }
    return (
      <span className={cn("inline-flex items-baseline gap-1.5 whitespace-nowrap", className)}>
        {number}
        <span className="text-xs font-semibold text-stencil-muted">{symbol}</span>
        {word ? <span className="text-xs font-semibold text-stencil">{word}</span> : null}
      </span>
    );
  }

  const packs = packSize && packSize > 1 ? Math.floor(quantity / packSize) : 0;
  const showPacks = Boolean(packSize && packSize > 1 && packName && unitName) && packs >= 1;
  const packLabel = <bdi>{pluralise(packName ?? "", packs, locale)}</bdi>;
  const unitLabel = <bdi>{pluralise(unitName ?? "", quantity, locale)}</bdi>;

  // Take sheet: generous type, the two counts side by side.
  if (size === "sheet") {
    if (!showPacks) {
      return (
        <span className={cn("inline-flex items-baseline gap-2", className)}>
          <RollingNumber value={quantity} className={cn("numeral text-3xl", statusInk)} />
          <span className="w-10 rtl:w-16 text-xs font-semibold text-stencil">{word}</span>
        </span>
      );
    }
    return (
      <span className={cn("inline-flex flex-wrap items-baseline gap-x-2", className)}>
        <span className="inline-flex items-baseline gap-1.5">
          <RollingNumber value={packs} className={cn("numeral text-3xl", statusInk)} />
          <span className="text-base font-semibold text-stencil">{packLabel}</span>
        </span>
        <span className="text-sm font-semibold text-stencil-muted">{t("common.or")}</span>
        <span className="inline-flex items-baseline gap-1 text-stencil-muted">
          <RollingNumber value={quantity} className="numeral text-xl" />
          <span className="text-sm font-semibold">{unitLabel}</span>
        </span>
      </span>
    );
  }

  // List row: one compact line, small enough to sit beside the actions.
  if (!showPacks) {
    return (
      <span className={cn("inline-flex items-baseline gap-1.5 whitespace-nowrap", className)}>
        <RollingNumber value={quantity} className={cn("numeral text-xl", statusInk)} />
        {unitName ? <span className="text-xs font-semibold text-stencil-muted">{unitLabel}</span> : null}
        {word ? <span className="text-xs font-semibold text-stencil">{word}</span> : null}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-baseline gap-1.5 whitespace-nowrap", className)}>
      <span className="inline-flex items-baseline gap-1">
        <RollingNumber value={packs} className={cn("numeral text-xl", statusInk)} />
        <span className="text-xs font-semibold text-stencil">{packLabel}</span>
      </span>
      <span className="text-xs font-semibold text-stencil-muted">{t("common.or")}</span>
      <span className="inline-flex items-baseline gap-1 text-stencil-muted">
        <RollingNumber value={quantity} className="numeral text-sm" />
        <span className="text-[0.7rem] font-semibold">{unitLabel}</span>
      </span>
    </span>
  );
}
