"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  /** Start here on mount and roll to `value` once (the low-stock count-up). */
  from?: number;
  className?: string;
  /** Write the rolling integer another way, e.g. grams as "1.25" kg. */
  format?: (n: number) => string;
};

function rollDuration(): number {
  if (typeof window === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--duration-roll").trim();
  const ms = raw.endsWith("ms") ? parseFloat(raw) : raw.endsWith("s") ? parseFloat(raw) * 1000 : 0;
  return Number.isFinite(ms) ? ms : 0;
}

// A number that rolls to its new value after a change. Reads --duration-roll
// so prefers-reduced-motion (which zeroes it) makes the change instant.
export function RollingNumber({ value, from, className, format }: Props) {
  const [shown, setShown] = useState(from ?? value);
  const shownRef = useRef(shown);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = shownRef.current;
    const end = value;
    if (start === end) return;
    const duration = rollDuration();
    const t0 = performance.now();
    const step = (now: number) => {
      // With reduced motion the duration is 0 and the first frame lands on the end value.
      const t = duration === 0 ? 1 : Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(start + (end - start) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return <span className={className}>{format ? format(shown) : shown.toLocaleString("en-GB")}</span>;
}
