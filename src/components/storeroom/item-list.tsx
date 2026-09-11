"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemRow } from "@/components/storeroom/item-row";
import { runningLowHeading } from "@/lib/labels";
import { groupByLocation, runningLow, type ItemRow as ItemRowData } from "@/lib/item-view";

type Props = {
  items: ItemRowData[];
  filtered: boolean;
};

// The storeroom list: a running-low strip, then location groups in walk
// order. A heavy rule and an uppercase heading open every group (the aisle
// sign). An item can appear in both the strip and its group on purpose.
export function ItemList({ items, filtered }: Props) {
  const router = useRouter();
  const low = runningLow(items);
  const groups = groupByLocation(items);

  // Phase 3 replaces this with the take sheet.
  const onTake = (item: ItemRowData) => router.push(`/items/${item.id}`);

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
          {runningLowHeading(low.length)}
        </h2>
        {low.length > 0 ? (
          <ul className="mt-2">
            {low.map((item) => (
              <ItemRow key={item.id} item={item} onTake={onTake} showLocation />
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
              <ItemRow key={item.id} item={item} onTake={onTake} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
