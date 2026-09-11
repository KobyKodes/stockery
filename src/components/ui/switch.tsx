"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-control border border-stencil bg-paper p-[2px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel data-checked:bg-stencil disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="block size-5 rounded-control bg-stencil transition-transform duration-fast ease-out data-checked:translate-x-5 data-checked:bg-safety"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
