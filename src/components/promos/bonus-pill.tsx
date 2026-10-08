import type { ReactNode } from "react";

/** The "+N% bonus" tag on a promoted transfer. Emerald, since a bonus is good news — amber means a warning here. */
export function BonusPill({ children }: { children: ReactNode }) {
  return (
    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      {children}
    </span>
  );
}
