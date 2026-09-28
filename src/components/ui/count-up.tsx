"use client";

import { useEffect, useRef, useState } from "react";
import { formatCents } from "@/lib/format";

/**
 * Counts from zero up to `value` on mount.
 *
 * `format` is a name rather than a function on purpose: every caller is a
 * Server Component, and a function prop can't cross that boundary — passing
 * one throws "Functions cannot be passed directly to Client Components" at
 * request time, which a build won't catch on a force-dynamic page.
 *
 * Renders the final value on the server and for anyone who prefers reduced
 * motion, so the number is never wrong or missing — only the approach to it
 * is animated.
 */
const FORMATTERS = {
  number: (n: number) => n.toLocaleString(),
  cents: formatCents,
} as const;

export function CountUp({
  value,
  format,
  durationMs = 750,
  className = "",
}: {
  value: number;
  format: keyof typeof FORMATTERS;
  durationMs?: number;
  className?: string;
}) {
  const [shown, setShown] = useState(value);
  const frame = useRef<number>(undefined);

  useEffect(() => {
    // State already starts at the real value, so opting out means doing nothing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease-out cubic: fast at first, settling onto the real figure.
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [value, durationMs]);

  return (
    <span className={`tabular-nums ${className}`} suppressHydrationWarning>
      {FORMATTERS[format](shown)}
    </span>
  );
}
