import { signIn } from "@/lib/auth";
import { CoinsIcon, CompassIcon, LogoMarkIcon, TargetIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { pageTitleClass } from "@/components/ui/text";

const highlights = [
  { icon: CoinsIcon, text: "See what every balance is really worth" },
  { icon: TargetIcon, text: "Set a trip goal and watch the gap close" },
  { icon: CompassIcon, text: "Know which points to burn where" },
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const denied = error === "AccessDenied";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-6 py-20">
      <div className="w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-col items-center gap-4 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-8 pb-8 pt-10 text-center dark:from-emerald-950/60 dark:via-zinc-900 dark:to-teal-950/40">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
            <LogoMarkIcon className="h-8 w-8" />
          </span>
          <div>
            <h1 className={pageTitleClass}>
              PointHacker
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              Get the most out of every reward point.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-8 py-7">
          <ul className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <Button type="submit" className="w-full gap-2">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z"
                  opacity=".9"
                />
                <path
                  fill="currentColor"
                  d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"
                  opacity=".75"
                />
                <path
                  fill="currentColor"
                  d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9l3.3-2.5z"
                  opacity=".6"
                />
                <path
                  fill="currentColor"
                  d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6z"
                  opacity=".85"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          {denied && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:bg-red-950/60 dark:text-red-300">
              That Google account isn&apos;t on the invite list. Ask the owner to add it.
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
        Your balances and cards are private to your account.
      </p>
    </div>
  );
}
