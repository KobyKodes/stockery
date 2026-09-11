"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ItemThumb } from "@/components/item-thumb";
import { QuantityNumeral } from "@/components/quantity-numeral";
import { StockBar } from "@/components/stock-bar";
import { Button } from "@/components/ui/button";
import type { ItemRow as ItemRowData } from "@/lib/item-view";
import { pluralise } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Props = {
  item: ItemRowData;
  onTake: (item: ItemRowData) => void;
  showLocation?: boolean;
  flash?: boolean;
};

// One row, two layouts. Desktop (≥900px): fixed columns so numerals line up
// down the page. Phone: two lines, 64px tall, the whole row opens the take
// sheet and a chevron at the far right opens edit.
export function ItemRow({ item, onTake, showLocation = false, flash = false }: Props) {
  const secondary = [showLocation ? item.location?.name : null, item.category?.name].filter(Boolean).join(", ");
  const thresholdLine = item.threshold > 0 ? `of ${item.threshold.toLocaleString("en-GB")} threshold` : "no threshold";

  return (
    <li className={cn("rule-hair", flash && "flash")} data-item-id={item.id}>
      {/* Desktop row */}
      <div className="hidden h-row items-center gap-4 desk:grid desk:grid-cols-[40px_minmax(0,1fr)_9rem_11rem_9rem]">
        <ItemThumb item={item} size={40} />
        <div className="min-w-0">
          <Link href={`/items/${item.id}`} className="block truncate text-base font-semibold hover:underline">
            {item.name}
          </Link>
          <p className="truncate text-xs text-stencil-muted">
            {[item.description, secondary].filter(Boolean).join(". ")}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <QuantityNumeral quantity={item.quantity} status={item.status} />
          <StockBar quantity={item.quantity} threshold={item.threshold} status={item.status} className="mt-1 w-28" />
        </div>
        <p className="truncate text-xs text-stencil-muted tabular">
          {pluralise(item.unitName, item.quantity)}, {thresholdLine}
        </p>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onTake(item)}>
            Take
          </Button>
          <Button size="sm" variant="ghost" render={<Link href={`/items/${item.id}/edit`} />}>
            Edit
          </Button>
        </div>
      </div>

      {/* Phone row */}
      <div className="flex h-row-touch items-stretch desk:hidden">
        <button
          type="button"
          onClick={() => onTake(item)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Take ${item.name}, ${item.quantity} ${pluralise(item.unitName, item.quantity)} left`}
        >
          <ItemThumb item={item} size={40} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-semibold">{item.name}</span>
            <span className="truncate text-xs text-stencil-muted">{secondary || pluralise(item.unitName, 2)}</span>
          </span>
          <span className="flex shrink-0 flex-col items-end">
            <QuantityNumeral quantity={item.quantity} status={item.status} />
            <StockBar quantity={item.quantity} threshold={item.threshold} status={item.status} className="mt-1 w-20" />
          </span>
        </button>
        <Link
          href={`/items/${item.id}/edit`}
          aria-label={`Edit ${item.name}`}
          className="flex w-11 shrink-0 items-center justify-center text-stencil-muted"
        >
          <ChevronRight aria-hidden className="size-5" />
        </Link>
      </div>
    </li>
  );
}
