"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemRow } from "@/components/storeroom/item-row";
import { RollingNumber } from "@/components/rolling-number";
import { RearrangeGroup } from "@/components/storeroom/rearrange-group";
import { TakeSheet } from "@/components/take-sheet";
import { api } from "@/lib/fetcher";
import { useT } from "@/lib/i18n/client";
import { groupByCategory, runningLow, type ItemRow as ItemRowData } from "@/lib/item-view";

type Props = {
  items: ItemRowData[];
  presets: number[];
  filtered: boolean;
};

// The storeroom list: a running-low strip, then category groups (ordered by
// each category's sortOrder). A heavy rule and an uppercase heading open
// every group. An item can appear in both the strip and its group on purpose.
export function ItemList({ items: serverItems, presets, filtered }: Props) {
  const t = useT();
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
  const [rearranging, setRearranging] = useState(false);
  const [order, setOrder] = useState<Record<string, string[]>>({});
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

  async function saveOrder(key: string, ids: string[]) {
    setOrder((o) => ({ ...o, [key]: ids }));
    await api("/api/items/reorder", { method: "POST", body: { orderedIds: ids } }).catch(() => {});
  }

  const low = runningLow(items);
  const groups = groupByCategory(items, t("common.uncategorized")).map((g) => {
    const ids = order[g.key];
    if (!ids) return g;
    const byId = new Map(g.items.map((i) => [i.id, i]));
    return { ...g, items: ids.map((id) => byId.get(id)).filter((i): i is ItemRowData => !!i) };
  });
  const selectedLive = selected ? (items.find((i) => i.id === selected.id) ?? selected) : null;

  if (items.length === 0) {
    return filtered ? (
      <p className="py-12 text-base text-stencil-muted">{t("storeroom.noMatches")}</p>
    ) : (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-lg">{t("storeroom.empty")}</p>
        <Button render={<Link href="/items/new" />}>
          <Plus aria-hidden />
          {t("storeroom.addFirstItem")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="-mb-6 flex items-center justify-between gap-4">
        {rearranging ? (
          <p className="text-base text-stencil-muted">{t("storeroom.rearrangeHint")}</p>
        ) : (
          <span />
        )}
        <Button variant="ghost" size="sm" aria-pressed={rearranging} onClick={() => setRearranging((r) => !r)}>
          {rearranging ? t("storeroom.doneRearranging") : t("storeroom.rearrange")}
        </Button>
      </div>

      {/* While rearranging, the strip would repeat rows out of shelf order. */}
      {rearranging ? null : (
      <section aria-labelledby="running-low">
        <h2 id="running-low" className="rule-hair pt-3 font-body text-base font-semibold">
          {low.length === 0 ? (
            t("storeroom.nothingLow")
          ) : (
            <>
              <RollingNumber value={low.length} from={0} className="tabular" />{" "}
              {t("storeroom.runningLow", { count: low.length })}
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
      )}

      {groups.map((group) => (
        <section key={group.key} aria-labelledby={`group-${group.key}`}>
          <h2
            id={`group-${group.key}`}
            className="sticky top-[59px] z-10 rule-heavy bg-concrete pt-2 pb-2 font-display text-lg font-bold uppercase leading-display tracking-[0.02em]"
          >
            {group.name}
          </h2>
          {rearranging ? (
            <RearrangeGroup items={group.items} onReorder={(ids) => void saveOrder(group.key, ids)} />
          ) : (
            <ul>
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} onTake={setSelected} flash={flashId === item.id} />
              ))}
            </ul>
          )}
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
