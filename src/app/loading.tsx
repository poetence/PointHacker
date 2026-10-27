import { pageContainerClass } from "@/components/ui/page-header";

// Every page here waits on the database before it can render anything, so without
// this a nav tap showed no response for seconds. A placeholder in the page's own
// shape (header tile, title, two sections of rows) shows the tap landed.

const blockClass = "rounded-xl bg-zinc-200/70 motion-safe:animate-pulse dark:bg-zinc-800/70";

export default function Loading() {
  return (
    <div className={pageContainerClass} role="status" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="flex items-center gap-4" aria-hidden="true">
        <div className={`h-14 w-14 shrink-0 rounded-2xl ${blockClass}`} />
        <div className="flex flex-1 flex-col gap-2">
          <div className={`h-8 w-1/2 ${blockClass}`} />
          <div className={`h-4 w-3/4 ${blockClass}`} />
        </div>
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-3" aria-hidden="true">
          <div className={`h-6 w-40 ${blockClass}`} />
          <div className={`h-24 ${blockClass}`} />
          <div className={`h-24 ${blockClass}`} />
        </div>
      ))}
    </div>
  );
}
