import type { CardGapContribution } from "@/lib/goals/close-gap-with-cards";

/** " via transfer (+30%)" when the bonus has to be moved, "" when it lands directly. */
function viaLabel(viaTransfer: CardGapContribution["viaTransfer"]): string {
  if (!viaTransfer) return "";
  if (!viaTransfer.activeBonusPercent) return " via transfer";
  return ` via transfer (+${viaTransfer.activeBonusPercent}%)`;
}

/** "Closes the gap → Virgin Atlantic" / "Leaves 22,000 short → United" for a card's welcome bonus. */
export function GapCardPill({ contribution }: { contribution: CardGapContribution }) {
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
          : `Leaves ${contribution.shortfallAfter.toLocaleString("en-US")} short`}
      </span>
      <span className="opacity-80">
        +{contribution.pointsContributed.toLocaleString("en-US")} {contribution.targetProgramName}
        {viaLabel(contribution.viaTransfer)}
      </span>
    </span>
  );
}
