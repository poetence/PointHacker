import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { LogoMarkIcon } from "@/components/icons";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Cards" },
  { href: "/programs", label: "Catalog" },
  { href: "/plan", label: "Plan a Trip" },
  { href: "/promos", label: "Promos" },
  { href: "/recommend", label: "Recommend" },
];

export async function Nav() {
  const session = await auth();

  return (
    <nav className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-6 py-3 text-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-display text-base font-semibold tracking-tight text-black dark:text-zinc-50"
        >
          <LogoMarkIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          PointHacker
        </Link>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {session?.user && (
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 dark:text-zinc-400">
            {session.user.email ?? session.user.name}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/sign-in" });
            }}
          >
            <button
              type="submit"
              className="text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </nav>
  );
}
