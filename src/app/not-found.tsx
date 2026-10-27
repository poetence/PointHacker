import Link from "next/link";
import { CompassIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { pageContainerClass } from "@/components/ui/page-header";
import { pageTitleClass, quietLinkClass } from "@/components/ui/text";

// Shown for a mistyped URL and for `notFound()` — a goal or program id that
// doesn't exist, or a goal that was deleted in another tab.
export default function NotFound() {
  return (
    <div className={pageContainerClass}>
      <h1 className={pageTitleClass}>Page not found</h1>
      <EmptyState icon={CompassIcon}>
        That page doesn&apos;t exist — it may have been deleted, or the link is out of date.
      </EmptyState>
      <div className="flex flex-wrap gap-4">
        <Link href="/" className={quietLinkClass}>
          &larr; Dashboard
        </Link>
        <Link href="/goals" className={quietLinkClass}>
          Your goals &rarr;
        </Link>
      </div>
    </div>
  );
}
