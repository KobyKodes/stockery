/* eslint-disable @next/next/no-img-element */
import { itemImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";

type Props = {
  item: { id: string; name: string; hasImage: boolean; imageVersion: string };
  size?: number;
  className?: string;
};

// A square photo, or a stencil-grey square with the item's first letter.
// Images are served from Postgres via the image route, so next/image adds
// nothing here.
export function ItemThumb({ item, size = 40, className }: Props) {
  const letter = item.name.trim().charAt(0).toUpperCase() || "?";
  if (item.hasImage) {
    return (
      <img
        src={itemImageUrl(item.id, item.imageVersion)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 bg-paper object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center bg-stencil-muted font-display font-bold leading-none text-paper",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
    >
      {letter}
    </span>
  );
}
