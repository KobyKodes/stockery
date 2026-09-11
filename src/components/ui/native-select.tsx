import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// A native <select>, styled to match Input. Native pickers are the best
// control on a phone in a storeroom, so nothing custom replaces them.
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select
        data-slot="select"
        className={cn(
          "h-tap w-full min-w-0 appearance-none rounded-control border border-stencil-muted bg-paper pl-3 pr-10 text-base text-stencil outline-none focus-visible:border-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-stencil-muted" />
    </span>
  );
}

export { NativeSelect };
