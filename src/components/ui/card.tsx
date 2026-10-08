/** The list-row card surface, without padding — for rows that carry a
 * full-bleed banner and pad their own content instead. */
export const rowCardFrameClass =
  "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700";

/** The list-row card surface. Hover lifts the border as well as the shadow —
 * on the near-black dark ground a shadow alone reads as no feedback at all. */
export const rowCardClass = `${rowCardFrameClass} p-4`;

/** The secondary-numbers line under a row's hairline: a wrapping `<dl>` of label/value pairs. */
export const rowBreakdownClass =
  "flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800";

/**
 * Inline style for a `.rise-in-item` row's entrance delay. Capped at the
 * seventh row so a long list doesn't keep the reader waiting.
 */
export function riseInDelay(index: number) {
  return { animationDelay: `${Math.min(index, 6) * 50}ms` };
}
