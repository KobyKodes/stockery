import { stockBarFraction, type StockStatus } from "@/lib/stock";
import { cn } from "@/lib/utils";

type Props = {
  quantity: number;
  threshold: number;
  status: StockStatus;
  className?: string;
};

// 6px bar in a soft track. Full at twice the threshold. Stencil when ok,
// safety when low, bay-red when out: the only place yellow appears in a row.
export function StockBar({ quantity, threshold, status, className }: Props) {
  const fraction = stockBarFraction({ quantity, threshold });
  return (
    <div aria-hidden className={cn("h-[6px] w-full bg-rule-soft", className)}>
      <div
        className={cn(
          "h-full",
          status === "ok" && "bg-status-ok",
          status === "low" && "bg-status-low",
          status === "out" && "bg-status-out",
        )}
        style={{ width: `${Math.round(fraction * 100)}%`, transitionProperty: "width", transitionDuration: "var(--duration-roll)", transitionTimingFunction: "var(--ease-out)" }}
      />
    </div>
  );
}
