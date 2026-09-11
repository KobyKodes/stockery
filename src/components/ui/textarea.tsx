import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-20 w-full rounded-control border border-stencil-muted bg-paper px-3 py-2 text-base text-stencil outline-none placeholder:text-stencil-muted focus-visible:border-steel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-bay-red",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
