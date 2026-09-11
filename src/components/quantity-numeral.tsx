import type { StockStatus } from "@/lib/stock";
import { statusWord } from "@/lib/labels";
import { RollingNumber } from "@/components/rolling-number";
import { cn } from "@/lib/utils";

type Props = {
  quantity: number;
  status: StockStatus;
  size?: "row" | "sheet";
  className?: string;
};

// The one bold element. 44px in a row, 72px in the take sheet. Status is
// told by color and by a word, and the bar below adds a third channel.
// The digits roll to a new value after a change.
export function QuantityNumeral({ quantity, status, size = "row", className }: Props) {
  const word = statusWord(status);
  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <RollingNumber
        value={quantity}
        className={cn(
          "numeral",
          size === "row" ? "text-2xl" : "text-3xl",
          status === "ok" && "text-status-ok-ink",
          status === "low" && "text-status-low-ink",
          status === "out" && "text-status-out-ink",
        )}
      />
      {/* The word slot is always reserved so digits line up down the column. */}
      <span className={cn("text-xs font-semibold text-stencil", size === "row" ? "w-7" : "w-10")}>{word}</span>
    </span>
  );
}
