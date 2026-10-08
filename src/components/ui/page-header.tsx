import type { ComponentType, ReactNode } from "react";
import { pageTitleClass } from "./text";

/** The width, padding and section rhythm every top-level page sits in. */
export const pageContainerClass = "mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16";

// Light and dark halves of each icon tile, written out in full so Tailwind
// can see every class.
const TILE_TONES = {
  emerald: [
    "from-emerald-100 to-emerald-50 text-emerald-700",
    "dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300",
  ],
  sky: ["from-sky-100 to-sky-50 text-sky-700", "dark:from-sky-950 dark:to-sky-900 dark:text-sky-300"],
  rose: ["from-rose-100 to-rose-50 text-rose-700", "dark:from-rose-950 dark:to-rose-900 dark:text-rose-300"],
  violet: [
    "from-violet-100 to-violet-50 text-violet-700",
    "dark:from-violet-950 dark:to-violet-900 dark:text-violet-300",
  ],
  amber: [
    "from-amber-100 to-amber-50 text-amber-700",
    "dark:from-amber-950 dark:to-amber-900 dark:text-amber-300",
  ],
} as const;

export type PageHeaderTone = keyof typeof TILE_TONES;

/** A top-level page's header: gradient icon tile, title, and a one-line subtitle (`children`). */
export function PageHeader({
  icon: Icon,
  tone,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: PageHeaderTone;
  title: ReactNode;
  children: ReactNode;
}) {
  const [light, dark] = TILE_TONES[tone];
  return (
    <header className="flex items-center gap-4">
      <span
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${light} shadow-sm ${dark}`}
      >
        <Icon className="h-7 w-7" />
      </span>
      <div>
        <h1 className={pageTitleClass}>{title}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{children}</p>
      </div>
    </header>
  );
}
