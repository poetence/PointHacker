import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Cards" },
  { href: "/programs", label: "Catalog" },
  { href: "/plan", label: "Plan a Trip" },
];

export function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b border-zinc-200 px-6 py-3 text-sm dark:border-zinc-800">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
