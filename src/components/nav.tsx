import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/cards", label: "Cards" },
  { href: "/programs", label: "Catalog" },
  { href: "/plan", label: "Plan a Trip" },
];

export async function Nav() {
  const session = await auth();

  return (
    <nav className="flex items-center justify-between gap-4 border-b border-zinc-200 px-6 py-3 text-sm dark:border-zinc-800">
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
