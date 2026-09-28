"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts from zero up to `value` on mount. `format` keeps the caller in charge
 * of how the number reads (thousands separators, currency), so this stays
 * agnostic about what it's counting.
 *
 * Renders the final value on the server and for anyone who prefers reduced
 * motion, so the number is never wrong or missing — only the approach to it
 * is animated.
 */
export function CountUp({
  value,
  format,
  durationMs = 750,
  className = "",
}: {
  value: number;
  format: (n: number) => string;
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
      {format(shown)}
    </span>
  );
}
