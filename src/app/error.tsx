"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { pageContainerClass } from "@/components/ui/page-header";
import { pageTitleClass, quietLinkClass } from "@/components/ui/text";

// What a page shows when it throws while rendering: in practice, the database
// timing out. Next's default is a bare unstyled message with no way back, so this
// keeps the nav and offers a retry, which re-fetches the page rather than just
// re-rendering the same failure.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={pageContainerClass}>
      <div className="flex flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <h1 className={pageTitleClass}>This page didn&apos;t load</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Something went wrong fetching your data — usually a brief connection problem. Trying
          again normally fixes it.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <Button onClick={() => retry()}>Try again</Button>
          <Link href="/" className={quietLinkClass}>
            Go to the dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
