import type { CardGapContribution } from "@/lib/goals/close-gap-with-cards";

/** "Closes the gap → Virgin Atlantic" / "Leaves 22,000 short → United" for a card's welcome bonus. */
export function GapCardPill({ contribution }: { contribution: CardGapContribution }) {
  const via = contribution.viaTransfer
    ? contribution.viaTransfer.activeBonusPercent
      ? ` via transfer (+${contribution.viaTransfer.activeBonusPercent}%)`
      : " via transfer"
    : "";

  return (
    <span
      className={`inline-flex flex-col rounded-lg px-2.5 py-1.5 text-xs ${
        contribution.closesGap
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      <span className="font-medium">
        {contribution.closesGap
          ? "Closes the gap"
          : `Leaves ${contribution.shortfallAfter.toLocaleString()} short`}
      </span>
      <span className="opacity-80">
        +{contribution.pointsContributed.toLocaleString()} {contribution.targetProgramName}
        {via}
      </span>
    </span>
  );
}
