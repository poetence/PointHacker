import type { SelectHTMLAttributes } from "react";
import { controlClass } from "./input";

export function Select({
  size = "md",
  className = "",
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "md" | "sm" }) {
  return (
    <select
      {...props}
      className={`${controlClass} ${size === "sm" ? "h-8 pl-2.5 pr-8" : "h-10 pl-3 pr-9"} w-full appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2371717a%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:16px] bg-[position:right_0.6rem_center] bg-no-repeat ${className}`}
    />
  );
}
