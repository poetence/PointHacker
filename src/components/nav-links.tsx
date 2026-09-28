"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavLink = { href: string; label: string };

/** Highlights the current section. Nested routes (/goals/abc) count as their parent. */
export function NavLinks({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <div className="fade-scroll-x scrollbar-none flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {links.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 rounded-full px-3 py-1.5 font-medium transition-[background-color,color,scale] duration-150 active:scale-[0.97] motion-reduce:active:scale-100 ${
              active
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
