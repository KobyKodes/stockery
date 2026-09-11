"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { StockPanel } from "@/components/stock-panel";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import type { ItemRow } from "@/lib/item-view";

type Props = {
  item: ItemRow | null;
  presets: number[];
  onOpenChange: (open: boolean) => void;
  onChange: (item: ItemRow) => void;
};

// Bottom sheet on phones, right-side panel on desktop. Focus is trapped
// inside; Escape closes. It stays open after a take so the next one is a tap.
export function TakeSheet({ item, presets, onOpenChange, onChange }: Props) {
  const t = useT();
  return (
    <DialogPrimitive.Root open={item !== null} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-40 bg-stencil/40 fade-enter" />
        <DialogPrimitive.Popup
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-y-auto bg-paper px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] shadow-sheet outline-none sheet-enter desk:inset-y-0 desk:end-0 desk:start-auto desk:w-[26rem] desk:max-h-none desk:px-6 desk:pt-4 desk:panel-enter"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between">
            <DialogPrimitive.Title className="text-xs font-semibold text-stencil-muted">
              {item ? t("stock.sheetTitle", { name: item.name }) : ""}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close render={<Button variant="ghost" size="icon" />}>
              <XIcon aria-hidden />
              <span className="sr-only">{t("common.close")}</span>
            </DialogPrimitive.Close>
          </div>
          {item ? <StockPanel key={item.id} item={item} presets={presets} onChange={onChange} className="mt-2" /> : null}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
