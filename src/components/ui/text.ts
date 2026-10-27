// Heading styles from the type ladder (see the page header and section
// headings), kept here so a heading change lands everywhere at once. Plain
// strings rather than components so client and server files can both use them.

export const pageTitleClass =
  "font-display text-3xl font-semibold tracking-tight text-black dark:text-zinc-50";

export const sectionTitleClass =
  "font-display text-xl font-semibold tracking-tight text-black dark:text-zinc-50";

/**
 * A standalone muted text link ("← All goals", "Full recommendations →"). min-h-6
 * gives it a 24px tap target on a phone; links inside a sentence don't need one.
 */
export const quietLinkClass =
  "inline-flex min-h-6 items-center text-sm text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline active:text-black dark:text-zinc-400 dark:hover:text-zinc-100 dark:active:text-white";
