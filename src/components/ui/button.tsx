import type { ButtonHTMLAttributes } from "react";

// Focus rings come from the global :focus-visible rule in globals.css, so no
// variant can accidentally ship without one.
const variantClass = {
  primary:
    "rounded-lg bg-emerald-600 px-4 text-white shadow-sm hover:bg-emerald-500 hover:shadow active:bg-emerald-700 active:shadow-none dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400 dark:active:bg-emerald-600",
  secondary:
    "rounded-lg border border-zinc-300 bg-white px-4 text-zinc-700 shadow-sm hover:border-zinc-400 hover:bg-zinc-50 active:bg-zinc-100 active:shadow-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:active:bg-zinc-700",
  danger:
    "rounded px-1 text-red-600 underline-offset-2 hover:underline active:text-red-700 dark:text-red-400 dark:active:text-red-300",
  link: "rounded px-1 text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline active:text-black dark:text-zinc-400 dark:hover:text-zinc-100 dark:active:text-white",
} as const;

// Only the filled variants take a press scale; text variants would jitter.
const pressClass = "active:scale-[0.98] motion-reduce:active:scale-100";

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
      className={`inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[background-color,border-color,color,box-shadow,scale] duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
        size === "sm" ? "h-8" : "h-10"
      } ${variantClass[variant]} ${
        variant === "primary" || variant === "secondary" ? pressClass : ""
      } ${className}`}
    />
  );
}
