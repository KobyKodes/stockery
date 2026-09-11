import Link from "next/link";
import { cn } from "@/lib/utils";

// One of the two agreed uppercase uses: the wordmark is a sign on a beam.
export function Wordmark({ href, className }: { href?: string; className?: string }) {
  const text = (
    <span className={cn("font-display text-xl font-bold uppercase leading-none tracking-[0.02em]", className)}>
      Stockery
    </span>
  );
  if (!href) return text;
  return (
    <Link href={href} className="inline-flex items-center rounded-control">
      {text}
    </Link>
  );
}
