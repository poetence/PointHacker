import type { BonusProgress } from "@/lib/cards/card-timeline";
import { formatCalendarDate, formatCents } from "@/lib/format";
import { BonusActions } from "./bonus-actions";

/** Where a wallet card's welcome bonus stands, with a spend bar while it's in progress. */
export function BonusTracker({
  id,
  cardName,
  progress,
  pointsUnit,
}: {
  id: string;
  cardName: string;
  progress: BonusProgress;
  pointsUnit: string;
}) {
  if (progress.kind === "none") return null;

  const points = `${progress.points.toLocaleString("en-US")} bonus ${pointsUnit}`;
  if (progress.kind === "received") {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Got the {points} on {formatCalendarDate(progress.receivedOn)}.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {progress.kind === "in_progress" && (
        <>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Spend{" "}
            <span className="font-medium text-black dark:text-zinc-50">{formatCents(progress.remainingCents)}</span>{" "}
            more
            {progress.deadline && (
              <>
                {" "}
                by{" "}
                <span className={progress.endingSoon ? "font-medium text-amber-700 dark:text-amber-400" : ""}>
                  {formatCalendarDate(progress.deadline)}
                </span>
              </>
            )}{" "}
            for the {points}
            {progress.daysLeft !== null && ` · ${progress.daysLeft} ${progress.daysLeft === 1 ? "day" : "days"} left`}
            {!progress.deadline && " · add when it was opened to see the deadline"}.
          </p>
          <SpendBar spentCents={progress.spentCents} spendCents={progress.spendCents} label={`${cardName} bonus spend`} />
        </>
      )}
      {progress.kind === "spend_met" && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">Spend met</span> — the {points} usually
          post within a statement or two.
        </p>
      )}
      {progress.kind === "deadline_passed" && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          The window for the {points} closed on {formatCalendarDate(progress.deadline)}. Did they post?
        </p>
      )}
      <BonusActions
        id={id}
        cardName={cardName}
        stage={progress.kind}
        spentCents={progress.kind === "in_progress" ? progress.spentCents : 0}
      />
    </div>
  );
}

function SpendBar({ spentCents, spendCents, label }: { spentCents: number; spendCents: number; label: string }) {
  const pct = spendCents > 0 ? Math.min(100, (spentCents / spendCents) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={spendCents}
      aria-valuenow={Math.min(spentCents, spendCents)}
      aria-valuetext={`${formatCents(spentCents)} of ${formatCents(spendCents)}, ${Math.round(pct)}%`}
      className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
    >
      <div
        className="bar-fill absolute inset-y-0 left-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
