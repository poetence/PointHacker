import type { InputHTMLAttributes, ReactNode } from "react";

// Fields signal focus with an emerald border and ring rather than the global
// focus-visible outline, which globals.css turns off for them.
export const controlClass =
  "rounded-lg border border-zinc-300 bg-white text-sm text-black shadow-sm outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-zinc-400 hover:border-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/25 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 disabled:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:hover:border-zinc-600 dark:focus:border-emerald-400 dark:disabled:bg-zinc-900/60 dark:disabled:text-zinc-500";

const sizeClass = {
  md: "h-10 px-3",
  sm: "h-8 px-2.5",
} as const;

export function Input({
  prefix,
  suffix,
  size = "md",
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> & {
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: keyof typeof sizeClass;
}) {
  const input = (
    <input
      {...props}
      className={`${controlClass} ${sizeClass[size]} w-full ${prefix ? "pl-7" : ""} ${
        suffix ? "pr-8" : ""
      } ${className}`}
    />
  );

  if (!prefix && !suffix) {
    return input;
  }

  return (
    <span className="relative block">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-zinc-400">
          {prefix}
        </span>
      )}
      {input}
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
          {suffix}
        </span>
      )}
    </span>
  );
}
