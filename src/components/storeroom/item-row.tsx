"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ItemThumb } from "@/components/item-thumb";
import { QuantityNumeral } from "@/components/quantity-numeral";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";
import { locationLabel, type ItemRow as ItemRowData } from "@/lib/item-view";
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
// sheet and a chevron at the far inline end opens edit.
export function ItemRow({ item, onTake, showLocation = false, flash = false }: Props) {
  const { locale, t } = useI18n();
  // Arabic uses its own comma, and it leans the other way.
  const comma = locale === "ar" ? "، " : ", ";
  const secondaryParts = [showLocation ? locationLabel(item.location) : null, item.category?.name].filter(
    (part): part is string => Boolean(part),
  );
  const secondaryText = secondaryParts.join(comma);
  const secondary = secondaryParts.map((part, i) => (
    <span key={part}>
      {i > 0 ? comma : null}
      <bdi>{part}</bdi>
    </span>
  ));

  return (
    <li className={cn("rule-hair", flash && "flash")} data-item-id={item.id}>
      {/* Desktop row */}
      <div className="hidden h-row items-center gap-4 desk:grid desk:grid-cols-[40px_minmax(0,1fr)_auto_9rem]">
        <ItemThumb item={item} size={40} />
        <div className="min-w-0">
          <Link href={`/items/${item.id}`} className="block truncate text-base font-semibold hover:underline">
            <bdi>{item.name}</bdi>
          </Link>
          <p className="truncate text-xs text-stencil-muted">
            {item.description ? <bdi>{item.description}</bdi> : null}
            {item.description && secondaryParts.length > 0 ? ". " : null}
            {secondary}
          </p>
        </div>
        <div className="flex items-center justify-end">
          <QuantityNumeral
            quantity={item.quantity}
            status={item.status}
            unitName={item.unitName}
            packSize={item.packSize}
            packName={item.packName}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => onTake(item)}>
            {t("row.take")}
          </Button>
          <Button size="sm" variant="ghost" render={<Link href={`/items/${item.id}/edit`} />}>
            {t("row.edit")}
          </Button>
        </div>
      </div>

      {/* Phone row */}
      <div className="flex h-row-touch items-stretch desk:hidden">
        <button
          type="button"
          onClick={() => onTake(item)}
          className="flex min-w-0 flex-1 items-center gap-3 text-start"
          aria-label={t("row.takeAria", {
            name: item.name,
            quantity: item.quantity,
            unit: pluralise(item.unitName, item.quantity, locale),
          })}
        >
          <ItemThumb item={item} size={40} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-semibold">
              <bdi>{item.name}</bdi>
            </span>
            <span className="truncate text-xs text-stencil-muted">
              {secondaryText ? secondary : <bdi>{pluralise(item.unitName, 2, locale)}</bdi>}
            </span>
          </span>
          <span className="flex shrink-0 items-center">
            <QuantityNumeral
              quantity={item.quantity}
              status={item.status}
              unitName={item.unitName}
              packSize={item.packSize}
              packName={item.packName}
            />
          </span>
        </button>
        <Link
          href={`/items/${item.id}/edit`}
          aria-label={t("row.editAria", { name: item.name })}
          className="flex w-11 shrink-0 items-center justify-center text-stencil-muted"
        >
          <ChevronRight aria-hidden className="size-5 rtl:-scale-x-100" />
        </Link>
      </div>
    </li>
  );
}
