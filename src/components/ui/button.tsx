import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Buttons say what happens. Safety yellow is reserved for the primary action;
// bay-red for destructive ones. Nothing here rounds past 4px.
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-control border font-body text-base font-semibold leading-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-steel disabled:pointer-events-none disabled:border-rule-soft disabled:bg-rule-soft disabled:text-stencil-muted [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-safety bg-safety text-stencil active:bg-safety-deep active:border-safety-deep",
        secondary: "border-stencil bg-transparent text-stencil active:bg-paper",
        ghost: "border-transparent bg-transparent text-stencil active:bg-paper",
        destructive: "border-bay-red bg-bay-red text-paper active:opacity-90",
        link: "h-auto border-transparent bg-transparent px-0 text-steel underline-offset-4 hover:underline disabled:bg-transparent disabled:border-transparent",
      },
      size: {
        default: "h-tap px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6 text-lg",
        icon: "size-tap",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // A button rendered as a link (render={<Link/>}) is not a native <button>.
  const nativeButton = props.nativeButton ?? !props.render;
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      nativeButton={nativeButton}
      {...props}
    />
  );
}

export { Button, buttonVariants };
