"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemRow } from "@/components/storeroom/item-row";
import { RollingNumber } from "@/components/rolling-number";
import { TakeSheet } from "@/components/take-sheet";
import { groupByLocation, runningLow, type ItemRow as ItemRowData } from "@/lib/item-view";

type Props = {
  items: ItemRowData[];
  presets: number[];
  filtered: boolean;
};

// The storeroom list: a running-low strip, then location groups in walk
// order. A heavy rule and an uppercase heading open every group (the aisle
// sign). An item can appear in both the strip and its group on purpose.
export function ItemList({ items: serverItems, presets, filtered }: Props) {
  // Rows changed in the take sheet are patched in place until the server
  // re-renders with fresh data (router.refresh after every change).
  const [overrides, setOverrides] = useState<Record<string, ItemRowData>>({});
  const [seen, setSeen] = useState(serverItems);
  if (seen !== serverItems) {
    setSeen(serverItems);
    setOverrides({});
  }
  const items = serverItems.map((i) => overrides[i.id] ?? i);

  const [selected, setSelected] = useState<ItemRowData | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  function onChange(item: ItemRowData) {
    setOverrides((o) => ({ ...o, [item.id]: item }));
    setFlashId(null);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    // Next frame so the class is removed and re-added, restarting the animation.
    requestAnimationFrame(() => {
      setFlashId(item.id);
      flashTimer.current = setTimeout(() => setFlashId(null), 450);
    });
  }

  const low = runningLow(items);
  const groups = groupByLocation(items);
  const selectedLive = selected ? (items.find((i) => i.id === selected.id) ?? selected) : null;

  if (items.length === 0) {
    return filtered ? (
      <p className="py-12 text-base text-stencil-muted">Nothing matches those filters.</p>
    ) : (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-lg">The storeroom is empty. Add the first thing on the shelf.</p>
        <Button render={<Link href="/items/new" />}>
          <Plus aria-hidden />
          Add your first item
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="running-low">
        <h2 id="running-low" className="rule-hair pt-3 font-body text-base font-semibold">
          {low.length === 0 ? (
            "Nothing is running low."
          ) : (
            <>
              <RollingNumber value={low.length} from={0} className="tabular" /> {low.length === 1 ? "item" : "items"} running low
            </>
          )}
        </h2>
        {low.length > 0 ? (
          <ul className="mt-2">
            {low.map((item) => (
              <ItemRow key={item.id} item={item} onTake={setSelected} showLocation flash={flashId === item.id} />
            ))}
          </ul>
        ) : null}
      </section>

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`group-${group.key}`}>
          <h2
            id={`group-${group.key}`}
            className="sticky top-[59px] z-10 rule-heavy bg-concrete pt-2 pb-2 font-display text-lg font-bold uppercase leading-display tracking-[0.02em]"
          >
            {group.name}
          </h2>
          <ul>
            {group.items.map((item) => (
              <ItemRow key={item.id} item={item} onTake={setSelected} flash={flashId === item.id} />
            ))}
          </ul>
        </section>
      ))}

      <TakeSheet
        item={selectedLive}
        presets={presets}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onChange={onChange}
      />
    </div>
  );
}
