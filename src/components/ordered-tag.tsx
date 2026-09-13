"use client";

import { Truck } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

// "Ordered": more of this is on the way. Steel rather than yellow or red, so it
// reads as information beside the stock status, not as another warning.
export function OrderedTag({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-[0.04em] text-steel",
        className,
      )}
    >
      <Truck aria-hidden className="size-3.5 rtl:-scale-x-100" />
      {t("row.ordered")}
    </span>
  );
}
