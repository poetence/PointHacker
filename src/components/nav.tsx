import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { LogoMarkIcon } from "@/components/icons";
import { NavLinks, type NavLink } from "@/components/nav-links";
import { Button } from "@/components/ui/button";

const links: NavLink[] = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Cards" },
  { href: "/programs", label: "Catalog" },
  { href: "/goals", label: "Goals" },
  { href: "/plan", label: "Plan a Trip" },
  { href: "/promos", label: "Promos" },
  { href: "/recommend", label: "Recommend" },
];

export async function Nav() {
  const session = await auth();
  const user = session?.user;
  const displayName = user?.name ?? user?.email ?? "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 text-sm backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-5">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-1.5 font-display text-base font-semibold tracking-tight text-black dark:text-zinc-50"
          >
            <LogoMarkIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">PointHacker</span>
          </Link>
          {user && <NavLinks links={links} />}
        </div>

        {user && (
          <div className="flex shrink-0 items-center gap-2">
            <span
              title={user.email ?? undefined}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white shadow-sm"
            >
              {initial}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/sign-in" });
              }}
            >
              <Button size="sm" variant="link" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
