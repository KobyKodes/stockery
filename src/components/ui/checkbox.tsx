"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// The box is 24px so it matches the type around it, but the thing you press
// is 44px, because this is used with a thumb in a storeroom.
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group flex size-tap shrink-0 items-center justify-center rounded-control outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="flex size-6 items-center justify-center rounded-control border border-stencil bg-paper group-data-checked:bg-stencil group-data-checked:text-paper">
        <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center">
          <CheckIcon aria-hidden className="size-4" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
