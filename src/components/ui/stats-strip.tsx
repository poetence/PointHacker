import type { ReactNode } from "react";

const STAT_TONES = {
  default: "text-black dark:text-zinc-50",
  positive: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
} as const;

/**
 * A page's headline numbers in one raised strip, split by hairlines.
 * `className` sets the grid columns and divider directions for its count.
 */
export function StatsStrip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <dl
      className={`grid divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50 ${className}`}
    >
      {children}
    </dl>
  );
}

export function Stat({
  label,
  tone = "default",
  children,
}: {
  label: string;
  tone?: keyof typeof STAT_TONES;
  children: ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={`font-display text-xl font-semibold tracking-tight sm:text-2xl ${STAT_TONES[tone]}`}>
        {children}
      </dd>
    </div>
  );
}
