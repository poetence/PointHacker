import { signIn } from "@/lib/auth";
import { LogoMarkIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const denied = error === "AccessDenied";

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-6 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 shadow-sm dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300">
        <LogoMarkIcon className="h-8 w-8" />
      </span>

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          PointHacker
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Sign in to see your reward point balances.
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <Button type="submit" className="px-5">
          Sign in with Google
        </Button>
      </form>

      {denied && (
        <p className="text-sm text-red-600 dark:text-red-400">
          That Google account isn&apos;t on the invite list. Ask the owner to add it.
        </p>
      )}
    </div>
  );
}
