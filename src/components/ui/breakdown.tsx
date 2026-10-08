import type { ReactNode } from "react";
import { rowBreakdownClass } from "./card";

/** A row's secondary numbers under a hairline, as label/value pairs. */
export function Breakdown({ children }: { children: ReactNode }) {
  return <dl className={rowBreakdownClass}>{children}</dl>;
}

export function BreakdownItem({
  label,
  valueClassName,
  children,
}: {
  label: string;
  valueClassName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className={valueClassName}>{children}</dd>
    </div>
  );
}
