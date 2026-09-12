import { signIn } from "@/lib/auth";

export default function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-6 py-24 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
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
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Sign in with Google
        </button>
      </form>
    </div>
  );
}
