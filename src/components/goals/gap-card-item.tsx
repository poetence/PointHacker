import { formatCents, programLabel } from "@/lib/format";
import type { GapCardRow } from "@/lib/goals/get-goal-gap-cards";
import { CardArt } from "@/components/recommendations/card-art";
import { GapCardPill } from "@/components/goals/gap-card-pill";
import { rowCardClass } from "@/components/ui/card";

/**
 * A catalog card whose welcome bonus moves a goal forward: the card, its bonus
 * terms, and how far the bonus gets you. `highlightClosers` rings the cards
 * that close the gap outright.
 */
export function GapCardItem({
  card,
  contribution,
  highlightClosers = false,
}: GapCardRow & { highlightClosers?: boolean }) {
  const ring = highlightClosers && contribution.closesGap ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : "";
  return (
    <li className={`flex flex-wrap items-center gap-4 ${rowCardClass} ${ring}`}>
      <CardArt issuer={card.issuer} name={card.name} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-black dark:text-zinc-50">
          {card.issuer} {card.name}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {card.welcomeBonusPoints?.toLocaleString("en-US")} {programLabel(card.program)}{" "}
          {card.program.pointsUnit} after {formatCents(card.welcomeBonusSpendCents ?? 0)} in{" "}
          {card.welcomeBonusMonths} mo ·{" "}
          {card.annualFeeCents > 0 ? `${formatCents(card.annualFeeCents)} fee` : "no fee"}
        </p>
      </div>
      <GapCardPill contribution={contribution} />
    </li>
  );
}
