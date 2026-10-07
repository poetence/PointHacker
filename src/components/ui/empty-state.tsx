import type { ComponentType, ReactNode } from "react";

/** What a list shows before it has rows: the page's icon, muted, over a one-line prompt. */
export function EmptyState({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
      <Icon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>
    </div>
  );
}
