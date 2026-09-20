import type { ButtonHTMLAttributes } from "react";

const variantClass = {
  primary:
    "rounded-lg bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400",
  secondary:
    "rounded-lg border border-zinc-300 bg-white px-4 text-zinc-700 shadow-sm hover:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-emerald-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
  danger: "px-1 text-red-600 hover:underline dark:text-red-400",
  link: "px-1 text-zinc-600 hover:underline dark:text-zinc-400",
} as const;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variantClass;
  size?: "md" | "sm";
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "h-8" : "h-10"
      } ${variantClass[variant]} ${className}`}
    />
  );
}
