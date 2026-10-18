import Link from "next/link";
import type { AwardGoal, ProgramType } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCalendarDate, programLabel } from "@/lib/format";
import { REGION_LABELS } from "@/lib/regions";
import { describeGoal, describeGoalUnit } from "@/lib/goals/cabins";
import { toGoalFormValues } from "@/lib/goals/goal-form-values";
import {
  getGoalsProgress,
  goalOriginZone,
  type BookedGoal,
  type GoalProgress,
} from "@/lib/goals/get-goal-progress";
import { percentCovered, type GoalTargetPlan } from "@/lib/goals/compute-goal-progress";
import { ORIGIN_ZONE_LABELS, originMultiplier } from "@/lib/goals/origin-adjustment";
import { getGoalGapCards } from "@/lib/goals/get-goal-gap-cards";
import { GoalActions } from "@/components/goals/goal-actions";
import { BookedToggle } from "@/components/goals/booked-toggle";
import { DeleteButton } from "@/components/ui/delete-button";
import { LocalDate } from "@/components/ui/local-date";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { GapCardItem } from "@/components/goals/gap-card-item";
import { SharedPointsNote } from "@/components/goals/shared-points-note";
import { ProgramBadge } from "@/components/programs/program-badge";
import { RegionScene } from "@/components/regions/region-scene";
import { TargetIcon } from "@/components/icons";
import { rowCardClass } from "@/components/ui/card";
import { pageContainerClass } from "@/components/ui/page-header";
import { pageTitleClass, sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Breakdown, BreakdownItem } from "@/components/ui/breakdown";

export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireSessionUserId();

  // Fetched with every other goal: what this one can count depends on the goals ahead of it.
  const allProgress = await getGoalsProgress(userId);
  const goalProgress = allProgress.byId.get(id);
  if (!goalProgress) {
    const booked = allProgress.booked.find((b) => b.goal.id === id);
    if (!booked) notFound();
    return <BookedGoalDetail booked={booked} />;
  }

  const { goal, shared: progress } = goalProgress;
  const { plans } = progress;
  const best = plans[0] ?? null;

  const programTypeById = await findProgramTypes(plans.map((p) => p.program.id));

  const gapCards = best && !best.isReachable ? await getGoalGapCards(userId, progress) : null;

  return (
    <div className={pageContainerClass}>
      <BackToGoals />
      <GoalHeader goal={goal} />

      <GoalActions goalId={goal.id} initial={toGoalFormValues(goal)} />

      {best ? (
        <BestRouteSummary goal={goal} best={best} goalProgress={goalProgress} />
      ) : (
        <EmptyState icon={TargetIcon}>
          No program in the catalog prices {describeGoalUnit(goal)} in{" "}
          {REGION_LABELS[goal.region]} yet — try another{" "}
          {goal.kind === "FLIGHT" ? "cabin" : "tier"}.
        </EmptyState>
      )}

      {plans.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Ways to book it</h2>
          <ul className="flex flex-col gap-3">
            {plans.map((plan, index) => (
              <PlanRow
                key={plan.program.id}
                plan={plan}
                heldInAll={heldInTarget(goalProgress, plan)}
                index={index}
                programType={programTypeById.get(plan.program.id) ?? (goal.kind === "HOTEL" ? "HOTEL" : "AIRLINE")}
              />
            ))}
          </ul>
        </section>
      )}

      {gapCards && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={sectionTitleClass}>Close the gap with a card</h2>
            <Link
              href={`/recommend?goal=${goal.id}`}
              className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Full recommendations &rarr;
            </Link>
          </div>

          {gapCards.ranked.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No catalog card&apos;s welcome bonus lands in a program that prices this trip.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {gapCards.ranked.slice(0, 3).map(({ card, contribution }) => (
                <GapCardItem key={card.id} card={card} contribution={contribution} />
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {goal.kind === "FLIGHT"
          ? "Flight award prices are rough saver-level estimates from North America"
          : "Hotel award prices are rough standard-room estimates per tier"}{" "}
        and change constantly; availability, peak dates, and free-night perks aren&apos;t modeled. Verify with the program before moving points — transfers
        are one-way.
      </p>
    </div>
  );
}

function BackToGoals() {
  return (
    <div>
      <Link href="/goals" className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
        &larr; All goals
      </Link>
    </div>
  );
}

function GoalHeader({ goal }: { goal: AwardGoal }) {
  return (
    <header className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800">
      <RegionScene region={goal.region} className="h-36" />
      <div className="bg-white px-5 py-4 dark:bg-zinc-900/50">
        <h1 className={`break-words ${pageTitleClass}`}>{goal.label}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {REGION_LABELS[goal.region]} · {describeGoal(goal)}
        </p>
      </div>
    </header>
  );
}

/** A booked goal has no plans to show — just what was booked, and a way to reopen it. */
function BookedGoalDetail({ booked }: { booked: BookedGoal }) {
  const { goal, redemptions } = booked;
  return (
    <div className={pageContainerClass}>
      <BackToGoals />
      <GoalHeader goal={goal} />

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="font-display text-xl font-semibold text-black dark:text-zinc-50">Booked.</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Marked booked on <LocalDate iso={goal.bookedAt!.toISOString()} />. It no longer holds points
          back, so your other goals are planned without it. Reopen it if the booking fell through.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <BookedToggle goalId={goal.id} booked />
        <DeleteButton
          url={`/api/goals/${goal.id}`}
          itemLabel="this goal"
          confirmMessage="Delete this goal? Its redemptions stay logged."
          redirectTo="/goals"
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>What you booked</h2>
        {redemptions.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No redemption is linked to this goal.{" "}
            <Link href="/redemptions" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">
              Log one
            </Link>{" "}
            and pick this goal to see what the trip cost and the rate you got.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {redemptions.map((r) => (
              <li key={r.id} className={`flex flex-wrap items-baseline justify-between gap-2 ${rowCardClass}`}>
                <div className="min-w-0">
                  <p className="break-words font-medium text-black dark:text-zinc-50">{r.description}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {programLabel(r.program)} · {formatCalendarDate(r.bookedOn)}
                  </p>
                </div>
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {r.pointsSpent.toLocaleString("en-US")} {r.program.pointsUnit}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** Each plan's program type, which picks its badge's colour and icon. */
async function findProgramTypes(programIds: string[]) {
  const programs = await prisma.rewardsProgram.findMany({
    where: { id: { in: programIds } },
    select: { id: true, type: true },
  });
  return new Map(programs.map((p) => [p.id, p.type]));
}

/** The headline under the header: whether the trip is bookable now, and where the points come from. */
function BestRouteSummary({
  goal,
  best,
  goalProgress,
}: {
  goal: AwardGoal;
  best: GoalTargetPlan;
  goalProgress: GoalProgress;
}) {
  const originZone = goalOriginZone(goal);
  const originPct = originZone ? Math.round((originMultiplier(goal.region, originZone) - 1) * 100) : 0;
  return (
    <div
      className={`rounded-xl border p-4 ${
        best.isReachable
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
      }`}
    >
      <p className="font-display text-xl font-semibold text-black dark:text-zinc-50">
        {best.isReachable
          ? `You can book this today via ${programLabel(best.program)}.`
          : `Closest route: ${programLabel(best.program)}, ${best.shortfall.toLocaleString("en-US")} ${best.program.pointsUnit} short.`}
      </p>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {best.pointsNeeded.toLocaleString("en-US")} {best.program.pointsUnit} for{" "}
        {describeGoalUnit(goal)} · you hold {heldInTarget(goalProgress, best).toLocaleString("en-US")}{" "}
        there
        {best.heldPoints < heldInTarget(goalProgress, best) &&
          ` (${best.heldPoints.toLocaleString("en-US")} not set aside for other goals)`}{" "}
        and can transfer in{" "}
        {(best.potentialPoints - best.heldPoints).toLocaleString("en-US")} more.
        {originZone && originPct !== 0 && (
          <>
            {" "}
            Prices {originPct < 0 ? "trimmed" : "bumped"} {Math.abs(originPct)}% for a{" "}
            {ORIGIN_ZONE_LABELS[originZone]} departure.
          </>
        )}
      </p>
      <SharedPointsNote
        standaloneBest={goalProgress.standalonePlans[0] ?? null}
        squeezedBy={goalProgress.squeezedBy}
        className="mt-2 text-sm"
      />
    </div>
  );
}

/** Everything the user holds in a plan's target program, before other goals take their share. */
function heldInTarget(goalProgress: GoalProgress, plan: GoalTargetPlan): number {
  return goalProgress.standalonePlans.find((p) => p.program.id === plan.program.id)?.heldPoints ?? plan.heldPoints;
}

function PlanRow({
  plan,
  heldInAll,
  index,
  programType,
}: {
  plan: GoalTargetPlan;
  heldInAll: number;
  index: number;
  programType: ProgramType;
}) {
  return (
    <li
      className={`flex flex-col gap-3 ${rowCardClass} ${
        index === 0 && plan.isReachable ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProgramBadge
            name={plan.program.name}
            shortName={plan.program.shortName}
            type={programType}
            size="sm"
          />
          <div>
            <Link
              href={`/programs/${plan.program.id}`}
              className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
            >
              {programLabel(plan.program)}
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {plan.pointsNeeded.toLocaleString("en-US")} {plan.program.pointsUnit} needed
            </p>
          </div>
        </div>
        <p
          className={`text-sm font-medium ${
            plan.isReachable
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          {plan.isReachable
            ? "Bookable now"
            : `${percentCovered(plan)}% there`}
        </p>
      </div>

      <GoalProgressBar
        heldPoints={plan.heldPoints}
        pointsCovered={plan.pointsCovered}
        pointsNeeded={plan.pointsNeeded}
        label={`Progress via ${programLabel(plan.program)}`}
      />

      <Breakdown>
        <BreakdownItem
          label="Held"
          valueClassName={
            plan.heldPoints > 0
              ? "font-medium text-emerald-600 dark:text-emerald-400"
              : "text-zinc-400 dark:text-zinc-500"
          }
        >
          {plan.heldPoints.toLocaleString("en-US")}
          {plan.heldPoints < heldInAll && ` free of ${heldInAll.toLocaleString("en-US")}`}
        </BreakdownItem>
        {plan.transfers.map((step) => (
          <BreakdownItem key={step.fromProgramId}
            label="Transfer"
            valueClassName="font-medium text-sky-600 dark:text-sky-400"
          >
            {step.pointsToTransfer.toLocaleString("en-US")} {step.fromProgramName} →{" "}
            {step.pointsReceived.toLocaleString("en-US")}
            {step.activeBonusPercent ? ` (+${step.activeBonusPercent}% bonus)` : ""}
          </BreakdownItem>
        ))}
        <BreakdownItem
          label="Short by"
          valueClassName={
            plan.shortfall > 0
              ? "font-medium text-red-600 dark:text-red-400"
              : "text-zinc-400 dark:text-zinc-500"
          }
        >
          {plan.shortfall > 0 ? plan.shortfall.toLocaleString("en-US") : "nothing"}
        </BreakdownItem>
      </Breakdown>
    </li>
  );
}

