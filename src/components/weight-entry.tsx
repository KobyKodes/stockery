"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/client";
import { toGrams, weightSymbol, weightUnitFor, type WeightUnit } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  value: number; // whole grams
  onChange: (grams: number) => void;
  autoFocus?: boolean;
};

/** The entry as typed into a number field: 1250 g in kg is "1.25". */
function asField(grams: number, unit: WeightUnit): string {
  return String(unit === "kg" ? grams / 1000 : grams);
}

// Enter a weight in grams or kilograms. The stored value is always whole
// grams, so "1.5 kg" and "1500 g" are the same entry.
export function WeightEntry({ id, value, onChange, autoFocus }: Props) {
  const { locale, t } = useI18n();
  const [unit, setUnit] = useState<WeightUnit>(() => weightUnitFor(value));
  const [text, setText] = useState(() => asField(value, unit));
  // Follow a value changed from outside without rewriting what is being typed
  // ("1." still means 1 kg until the next digit lands).
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (toGrams(Number(text), unit) !== value) setText(asField(value, unit));
  }

  function changeUnit(next: WeightUnit) {
    setUnit(next);
    setText(asField(value, next));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          autoFocus={autoFocus}
          className="w-32"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(toGrams(Number(e.target.value), unit));
          }}
          onFocus={(e) => e.currentTarget.select()}
        />
        <WeightUnitToggle unit={unit} onChange={changeUnit} />
      </div>
      {unit === "kg" && value > 0 ? (
        <p className="text-xs text-stencil-muted tabular">
          {t("packEntry.equals", { quantity: value.toLocaleString("en-GB"), unit: weightSymbol("g", locale) })}
        </p>
      ) : null}
    </div>
  );
}

/** Grams or kilograms, the same two-button switch as packs or units. */
export function WeightUnitToggle({ unit, onChange }: { unit: WeightUnit; onChange: (unit: WeightUnit) => void }) {
  const { locale, t } = useI18n();
  return (
    <div role="group" aria-label={t("weight.unitAria")} className="flex h-tap shrink-0 rounded-control border border-stencil">
      {(["g", "kg"] as const).map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={unit === u}
          onClick={() => onChange(u)}
          className={cn("px-3 text-base font-semibold", unit === u ? "bg-stencil text-paper" : "text-stencil")}
        >
          {weightSymbol(u, locale)}
        </button>
      ))}
    </div>
  );
}
