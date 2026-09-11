import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-tap w-full min-w-0 rounded-control border border-stencil-muted bg-paper px-3 text-base text-stencil outline-none tabular placeholder:text-stencil-muted focus-visible:border-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-bay-red",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
