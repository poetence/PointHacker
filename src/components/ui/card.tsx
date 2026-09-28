/** The list-row card surface, without padding — for rows that carry a
 * full-bleed banner and pad their own content instead. */
export const rowCardFrameClass =
  "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-[box-shadow,border-color] duration-200 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700";

/** The list-row card surface. Hover lifts the border as well as the shadow —
 * on the near-black dark ground a shadow alone reads as no feedback at all. */
export const rowCardClass = `${rowCardFrameClass} p-4`;
