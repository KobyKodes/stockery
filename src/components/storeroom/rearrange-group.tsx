"use client";

import { ItemThumb } from "@/components/item-thumb";
import { ReorderableList } from "@/components/settings/reorderable-list";
import { useI18n } from "@/lib/i18n/client";
import type { ItemRow } from "@/lib/item-view";
import { pluralise } from "@/lib/stock";

type Props = {
  items: ItemRow[];
  onReorder: (ids: string[]) => void;
};

// Rearrange mode for one location group. The order here is the order the
// items appear in the list and in a full count, so it should match the shelf.
export function RearrangeGroup({ items, onReorder }: Props) {
  const { locale, t } = useI18n();
  return (
    <ReorderableList
      items={items}
      label={t("storeroom.itemsInLocation")}
      onReorder={onReorder}
      renderRow={(item) => (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <ItemThumb item={item} size={32} />
          <span className="min-w-0 flex-1 truncate text-base font-semibold">
            <bdi>{item.name}</bdi>
          </span>
          <span className="shrink-0 text-xs text-stencil-muted tabular">
            {item.quantity} {pluralise(item.unitName, item.quantity, locale)}
          </span>
        </div>
      )}
    />
  );
}
