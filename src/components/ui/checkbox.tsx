import type { ComponentProps, ReactNode } from "react";

/**
 * A native checkbox with its label as one hit target. Colour comes from
 * `accent-color` — Tailwind's text-* utilities don't reach a native checkbox
 * without the forms plugin, which is why the old one rendered browser blue.
 */
export function Checkbox({
  label,
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type"> & { label: ReactNode }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 ${className}`}
    >
      <input
        {...props}
        type="checkbox"
        className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-600 dark:accent-emerald-500"
      />
      {label}
    </label>
  );
}
