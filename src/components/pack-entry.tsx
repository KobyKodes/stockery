"use client";

import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import { fromBaseUnits, pluralise, toBaseUnits } from "@/lib/stock";

type Props = {
  id: string;
  value: number; // base units
  onChange: (baseUnits: number) => void;
  unitName: string;
  packSize: number | null;
  packName: string | null;
  autoFocus?: boolean;
};

// Enter a quantity as packs + units when the item has packs, or as plain
// units otherwise. The stored value is always base units.
export function PackEntry({ id, value, onChange, unitName, packSize, packName, autoFocus }: Props) {
  const { locale, t } = useI18n();
  const hasPacks = !!packSize && packSize > 1 && !!packName;

  if (!hasPacks) {
    return (
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          autoFocus={autoFocus}
          className="w-32"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(toBaseUnits(0, Number(e.target.value), null))}
          onFocus={(e) => e.currentTarget.select()}
        />
        <span className="text-base text-stencil-muted">{pluralise(unitName, value, locale)}</span>
      </div>
    );
  }

  const { packs, units } = fromBaseUnits(value, packSize);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          autoFocus={autoFocus}
          className="w-24"
          value={packs}
          onChange={(e) => onChange(toBaseUnits(Number(e.target.value), units, packSize))}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={pluralise(packName, 2, locale)}
        />
        <span className="text-base text-stencil-muted">{pluralise(packName, packs, locale)}</span>
        <span className="text-base text-stencil-muted">+</span>
        <Input
          id={`${id}-units`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          className="w-24"
          value={units}
          onChange={(e) => onChange(toBaseUnits(packs, Number(e.target.value), packSize))}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={pluralise(unitName, 2, locale)}
        />
        <span className="text-base text-stencil-muted">{pluralise(unitName, units, locale)}</span>
      </div>
      <p className="text-xs text-stencil-muted tabular">
        {t("packEntry.equals", { quantity: value, unit: pluralise(unitName, value, locale) })}
      </p>
    </div>
  );
}
