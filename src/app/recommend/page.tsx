import Link from "next/link";
import type { AwardGoal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents, formatCentsPerPoint, programLabel } from "@/lib/format";
import { REGION_LABELS } from "@/lib/regions";
import { describeGoal } from "@/lib/goals/cabins";
import { getGoalsProgress, goalProgramIds, type GoalProgress } from "@/lib/goals/get-goal-progress";
import { SharedPointsNote } from "@/components/goals/shared-points-note";
import { getGoalGapCards, type GoalGapCardsResult } from "@/lib/goals/get-goal-gap-cards";
import type { GoalTargetPlan } from "@/lib/goals/compute-goal-progress";
import type { CardGapContribution } from "@/lib/goals/close-gap-with-cards";
import { GapCardPill } from "@/components/goals/gap-card-pill";
import { GapCardItem } from "@/components/goals/gap-card-item";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SPEND_CATEGORIES, SPEND_CATEGORY_LABELS } from "@/lib/spend-categories";
import {
  getCardRecommendations,
  toScoringProfile,
} from "@/lib/recommendations/get-card-recommendations";
import { effectiveRate, type CardRecommendation } from "@/lib/recommendations/score-cards";
import { OFF_PLAN_VALUE_SHARE, type TransferAccess } from "@/lib/recommendations/card-point-value";
import { getPersonalRates } from "@/lib/redemptions/get-redemptions";
import { PersonalRatePill } from "@/components/redemptions/personal-rate-pill";
import { SpendingProfileForm } from "@/components/recommendations/spending-profile-form";
import { CardArt } from "@/components/recommendations/card-art";
import { CashIcon } from "@/components/icons";
import { rowCardClass } from "@/components/ui/card";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Breakdown, BreakdownItem } from "@/components/ui/breakdown";

// No dynamic route segment here, so Next would otherwise try to statically
// prerender this at build time — which has no DATABASE_URL in CI.
export const dynamic = "force-dynamic";

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string }>;
}) {
  const { goal: goalParam } = await searchParams;
  const userId = await requireSessionUserId();

  const [profile, goalsProgress, personalRates] = await Promise.all([
    prisma.spendingProfile.findUnique({ where: { userId } }),
    getGoalsProgress(userId),
    getPersonalRates(userId),
  ]);
  const goals = goalsProgress.goals.map((p) => p.goal);
  const hasGoals = goalsProgress.goals.length > 0;
  const result = profile
    ? await getCardRecommendations(userId, profile, personalRates, goalProgramIds(goalsProgress))
    : null;
  const top = result?.ranked.slice(0, 8) ?? [];

  const activeGoal = goals.find((g) => g.id === goalParam) ?? goals[0] ?? null;
  const goalProgress = activeGoal ? (goalsProgress.byId.get(activeGoal.id) ?? null) : null;
  // The shared figure, so the cards target what's still missing once other goals take their share.
  const progress = goalProgress?.shared ?? null;
  const bestPlan = progress?.plans[0] ?? null;
  const gapCards =
    progress && bestPlan && !bestPlan.isReachable ? await getGoalGapCards(userId, progress) : null;

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={CashIcon} tone="emerald" title="Which card next?">
        Which welcome bonus closes the gap on your goal — and which cards earn the most for how
        you actually spend.
      </PageHeader>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={sectionTitleClass}>
            {goalProgress ? `Closing the gap for ${goalProgress.name}` : "Working toward a goal?"}
          </h2>
          {goals.length > 1 && activeGoal && (
            <form method="GET" className="flex items-center gap-2">
              <Select name="goal" size="sm" defaultValue={activeGoal.id} aria-label="Goal" className="w-48">
                {goalsProgress.goals.map(({ goal, name }) => (
                  <option key={goal.id} value={goal.id}>
                    {name}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="secondary">
                Switch
              </Button>
            </form>
          )}
        </div>

        <GoalGap activeGoal={activeGoal} bestPlan={bestPlan} goalProgress={goalProgress} gapCards={gapCards} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your spending</h2>
        <SpendingProfileForm initial={profile ? toScoringProfile(profile) : null} />
      </section>

      {!result && (
        <EmptyState icon={CashIcon}>
          Fill in your monthly spending above to see which cards earn you the most.
        </EmptyState>
      )}

      {result && (
        <>
          <section className="flex flex-col gap-3">
            <h2 className={sectionTitleClass}>Top cards for you</h2>

            {top.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No cards match your preferences — try raising the fee cap or widening the rewards
                type.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {top.map((rec, index) => (
                  <RecommendationRow
                    key={rec.card.id}
                    rec={rec}
                    index={index}
                    hasGoals={hasGoals}
                    contribution={gapCards?.byCardId.get(rec.card.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {Object.keys(result.bestByCategory).length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className={sectionTitleClass}>Best card by category</h2>
              <ul className="flex flex-wrap gap-2">
                {SPEND_CATEGORIES.map((category) => {
                  const best = result.bestByCategory[category];
                  if (!best) return null;
                  return (
                    <li
                      key={category}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {SPEND_CATEGORY_LABELS[category]}:
                      </span>{" "}
                      <span className="font-medium text-black dark:text-zinc-50">
                        {best.card.issuer} {best.card.name}
                      </span>{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">
                        ({effectiveRate(best.card, category)}x)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.alreadyHeld.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className={sectionTitleClass}>Already in your wallet</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {result.alreadyHeld.map((c) => `${c.issuer} ${c.name}`).join(", ")} — skipped
                since you already hold {result.alreadyHeld.length === 1 ? "it" : "them"}.
              </p>
            </section>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Estimates only: earn rates, fees, and bonuses are snapshots of public offers and change
            often. Points are valued at their best use, directly or through a transfer partner
            (promos left out — they last weeks, a card lasts years), at your own rate where
            you&apos;ve logged enough bookings.
            {hasGoals &&
              ` A use that can't book any of your goals counts at ${OFF_PLAN_VALUE_SHARE * 100}%.`}{" "}
            Statement credits, lounge access, and category caps aren&apos;t modeled. Verify with the
            issuer before applying.
          </p>
        </>
      )}
    </div>
  );
}

/** What the goal section says, from "no goal yet" down to the cards whose bonus closes the gap. */
function GoalGap({
  activeGoal,
  bestPlan,
  goalProgress,
  gapCards,
}: {
  activeGoal: AwardGoal | null;
  bestPlan: GoalTargetPlan | null;
  goalProgress: GoalProgress | null;
  gapCards: GoalGapCardsResult | null;
}) {
  if (!activeGoal) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/goals" className="underline-offset-2 hover:underline">
          Set an award goal
        </Link>{" "}
        and this page will tell you which card&apos;s welcome bonus gets you there.
      </p>
    );
  }
  if (!bestPlan) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No program in the catalog prices this trip yet, so there&apos;s no gap to close.{" "}
        <Link href={`/goals/${activeGoal.id}`} className="underline-offset-2 hover:underline">
          View goal &rarr;
        </Link>
      </p>
    );
  }
  if (bestPlan.isReachable) {
    return (
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Already bookable</span>{" "}
        via {programLabel(bestPlan.program)} — the ranking below is pure
        spending value.{" "}
        <Link href={`/goals/${activeGoal.id}`} className="text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400">
          View goal &rarr;
        </Link>
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {REGION_LABELS[activeGoal.region]} · {describeGoal(activeGoal)} · closest route is{" "}
        {programLabel(bestPlan.program)},{" "}
        {bestPlan.shortfall.toLocaleString("en-US")} {bestPlan.program.pointsUnit} short.{" "}
        <Link href={`/goals/${activeGoal.id}`} className="underline-offset-2 hover:underline">
          View goal &rarr;
        </Link>
      </p>
      <SharedPointsNote
        standaloneBest={goalProgress?.standalonePlans[0] ?? null}
        squeezedBy={goalProgress?.squeezedBy ?? []}
      />

      {gapCards && gapCards.ranked.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No catalog card&apos;s welcome bonus lands in a program that prices this trip.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {gapCards?.ranked.slice(0, 3).map(({ card, contribution }) => (
            <GapCardItem key={card.id} card={card} contribution={contribution} highlightClosers />
          ))}
        </ul>
      )}
    </>
  );
}

function RecommendationRow({
  rec,
  index,
  hasGoals,
  contribution,
}: {
  rec: CardRecommendation;
  index: number;
  hasGoals: boolean;
  contribution: CardGapContribution | undefined;
}) {
  const { best } = rec.pointValue;
  const notes = [transferAccessNote(rec.pointValue.access), hasGoals ? goalFitNote(rec) : null].filter(
    (note) => note !== null
  );

  return (
    <li
      className={`flex flex-col gap-3 ${rowCardClass} ${
        index === 0 ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <CardArt issuer={rec.card.issuer} name={rec.card.name} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-black dark:text-zinc-50">
            #{index + 1} {rec.card.issuer} {rec.card.name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {Math.round(rec.annualPoints).toLocaleString("en-US")}{" "}
            {programLabel(rec.card.program)}{" "}
            {rec.card.program.pointsUnit}/yr ·{" "}
            <span className="whitespace-nowrap">
              {formatCentsPerPoint(rec.pointValue.centsPerPoint)} each
            </span>
            {best.kind === "transfer" && (
              <>
                {" "}
                <span className="whitespace-nowrap">via {programLabel(best.program)}</span>
              </>
            )}
            <wbr />
            {best.personalRate && <PersonalRatePill rate={best.personalRate} />}
          </p>
          {notes.length > 0 && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{notes.join(" ")}</p>
          )}
        </div>
        <div className="w-full sm:w-auto sm:text-right">
          <p className="font-display text-xl font-semibold text-black dark:text-zinc-50">
            {formatCents(rec.firstYearValueCents)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            net first year &middot; {formatCents(rec.ongoingValueCents)}/yr after
          </p>
        </div>
      </div>

      {contribution && (
        <div className="flex">
          <GapCardPill contribution={contribution} />
        </div>
      )}

      <Breakdown>
        <BreakdownItem
          label="Earns"
          valueClassName="font-medium text-emerald-600 dark:text-emerald-400"
        >
          +{formatCents(rec.earnValueCents)}
        </BreakdownItem>
        <BreakdownItem
          label="Welcome bonus"
          valueClassName={
            rec.bonusEarned
              ? "font-medium text-emerald-600 dark:text-emerald-400"
              : "text-zinc-400 dark:text-zinc-500"
          }
        >
          {welcomeBonusLabel(rec)}
        </BreakdownItem>
        <BreakdownItem
          label="Annual fee"
          valueClassName={
            rec.card.annualFeeCents > 0
              ? "font-medium text-red-600 dark:text-red-400"
              : "text-zinc-400 dark:text-zinc-500"
          }
        >
          {rec.card.annualFeeCents > 0 ? `−${formatCents(rec.card.annualFeeCents)}` : "none"}
        </BreakdownItem>
      </Breakdown>
    </li>
  );
}

function cardNames(cards: { issuer: string; name: string }[]): string {
  return cards.map((card) => `${card.issuer} ${card.name}`).join(" or ");
}

/** Says when a card's points can't move on their own — or move on another card's terms. */
function transferAccessNote(access: TransferAccess): string | null {
  switch (access.kind) {
    case "full":
      return null;
    case "pooled":
      return `Pooled with your ${cardNames(access.withCards)}, its points transfer on that card's terms.`;
    case "reduced":
      return `Transfers at ${Math.round(access.share * 100)}% of the usual ratio${
        access.fullCards.length > 0 ? ` unless pooled with a ${cardNames(access.fullCards)}` : ""
      }.`;
    case "none":
      return `Transfers only alongside a ${cardNames(access.fullCards)}.`;
  }
}

/** Which of the card's uses book the user's goals — the ones counted in full. Null for a cash card. */
function goalFitNote(rec: CardRecommendation): string | null {
  const tripUses = rec.pointValue.uses.filter(
    (use) => use.program.type === "AIRLINE" || use.program.type === "HOTEL"
  );
  const booking = tripUses.filter((use) => use.servesGoals).map((use) => programLabel(use.program));
  if (booking.length > 0) {
    const shown = booking.slice(0, 3).join(", ");
    const more = booking.length > 3 ? ` and ${booking.length - 3} more` : "";
    return `Books your goals through ${shown}${more}.`;
  }
  if (tripUses.length === 0) return null;
  // Nothing it reaches prices a goal, so cash (a bank card's direct use) or a discounted trip program wins.
  if (rec.pointValue.best.servesGoals) {
    return "None of its partners price your goals, so its points are valued as cash.";
  }
  const subject = tripUses.length === 1 ? `${programLabel(tripUses[0].program)} doesn't` : "None of its programs";
  return `${subject} price any of your goals, so its points count at ${OFF_PLAN_VALUE_SHARE * 100}%.`;
}

/** The welcome-bonus cell: its value when the spending earns it, else what it would take. */
function welcomeBonusLabel(rec: CardRecommendation): string {
  if (rec.card.welcomeBonusPoints === null) return "none";
  if (rec.bonusEarned) return `+${formatCents(rec.welcomeBonusValueCents)}`;
  return `needs ${formatCents(rec.card.welcomeBonusSpendCents ?? 0)} in ${rec.card.welcomeBonusMonths} mo`;
}
