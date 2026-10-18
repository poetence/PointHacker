import Link from "next/link";
import type { AwardGoal } from "@prisma/client";
import { requireSessionUserId } from "@/lib/user";
import { REGION_LABELS } from "@/lib/regions";
import { describeGoal } from "@/lib/goals/cabins";
import {
  getGoalsProgress,
  type BookedGoal,
  type GoalProgress,
  type GoalsProgress,
} from "@/lib/goals/get-goal-progress";
import { GoalForm } from "@/components/goals/goal-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { TargetIcon } from "@/components/icons";
import { riseInDelay, rowCardClass, rowCardFrameClass } from "@/components/ui/card";
import { RegionScene } from "@/components/regions/region-scene";
import { programLabel } from "@/lib/format";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { percentCovered } from "@/lib/goals/compute-goal-progress";
import { GoalLinks, SharedPointsNote } from "@/components/goals/shared-points-note";
import { Stat, StatsStrip } from "@/components/ui/stats-strip";

// Goals and balances change via API mutations after build, so this page must
// be re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await requireSessionUserId();

  const progress = await getGoalsProgress(userId);
  const goals = progress.goals.map((p) => p.goal);
  const allGoals = [...goals, ...progress.booked.map((b) => b.goal)];

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={TargetIcon} tone="rose" title="Award goals">
        Name the trip, and see how close your points already get you.
      </PageHeader>

      {goals.length > 1 && <SharingSummary progress={progress} />}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Set a goal</h2>
        <GoalForm defaultOriginState={newestOrigin(allGoals)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your goals</h2>

        {goals.length === 0 ? (
          <EmptyState icon={TargetIcon}>
            {progress.booked.length > 0
              ? "Nothing left to save for — set your next trip above."
              : "No goals yet — set one above to see which of your balances get you there."}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {progress.goals.map((goalProgress, index) => (
              <GoalRow key={goalProgress.goal.id} progress={goalProgress} index={index} />
            ))}
          </ul>
        )}
      </section>

      {progress.booked.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Booked</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Booked trips don&apos;t hold points back, so the goals above are planned without them.
          </p>
          <ul className="flex flex-col gap-3">
            {progress.booked.map((booked, index) => (
              <BookedGoalRow key={booked.goal.id} booked={booked} index={index} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** The "Flying from" default: the newest goal that has one, booked or not. */
function newestOrigin(goals: AwardGoal[]): string {
  const withOrigin = goals.filter((g) => g.originState);
  withOrigin.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return withOrigin[0]?.originState ?? "";
}

/**
 * How the goals fare together: one balance can't pay for two trips, so the
 * soonest trip is planned first and each goal after it gets what's left.
 */
function SharingSummary({ progress }: { progress: GoalsProgress }) {
  const total = progress.goals.length;
  const alone = progress.goals.filter((p) => p.standalonePlans[0]?.isReachable).length;
  const together = progress.goals.filter((p) => p.shared.plans[0]?.isReachable).length;

  return (
    <section className="flex flex-col gap-3">
      <StatsStrip className="grid-cols-3 divide-x">
        <Stat label="Goals">{total}</Stat>
        <Stat label="Bookable on their own">{alone}</Stat>
        <Stat
          label="Bookable together"
          tone={together < alone ? "warning" : together > 0 ? "positive" : "default"}
        >
          {together}
        </Stat>
      </StatsStrip>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Goals share your points: the soonest trip is planned first, then undated goals in the
        order you set them, and each one counts only what the goals ahead of it leave.
      </p>
      {progress.contested.length > 0 && (
        <ul className="flex flex-col gap-2">
          {progress.contested.map((balance) => (
            <li
              key={balance.programId}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            >
              <span className="font-medium">{balance.programName} is stretched:</span>{" "}
              <GoalLinks goals={balance.goals} /> would use {balance.wanted.toLocaleString("en-US")}{" "}
              between them; you hold {balance.held.toLocaleString("en-US")}.
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function GoalRow({ progress, index }: { progress: GoalProgress; index: number }) {
  const { goal, squeezedBy } = progress;
  const best = progress.shared.plans[0] ?? null;
  return (
    <li className={`rise-in-item ${rowCardFrameClass}`} style={riseInDelay(index)}>
      <RegionScene region={goal.region} className="h-20" />
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/goals/${goal.id}`}
              className="break-words font-display text-xl font-semibold text-black underline-offset-2 hover:underline dark:text-zinc-50"
            >
              {goal.label}
            </Link>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {REGION_LABELS[goal.region]} · {describeGoal(goal)}
            </p>
          </div>
          <DeleteButton
            url={`/api/goals/${goal.id}`}
            itemLabel={`goal: ${goal.label}, ${describeGoal(goal)}`}
            confirmMessage="Delete this goal?"
          />
        </div>

        {best ? (
          <div className="flex flex-col gap-1.5">
            <GoalProgressBar
              heldPoints={best.heldPoints}
              pointsCovered={best.pointsCovered}
              pointsNeeded={best.pointsNeeded}
              label={`${goal.label} via ${programLabel(best.program)}`}
            />
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              {best.isReachable ? (
                <>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    Bookable now
                  </span>{" "}
                  via {programLabel(best.program)} —{" "}
                  {best.pointsNeeded.toLocaleString("en-US")} {best.program.pointsUnit}
                </>
              ) : (
                <>
                  Closest: {programLabel(best.program)} —{" "}
                  {best.pointsCovered.toLocaleString("en-US")} of{" "}
                  {best.pointsNeeded.toLocaleString("en-US")} {best.program.pointsUnit} (
                  {percentCovered(best)}%)
                </>
              )}
            </p>
            <SharedPointsNote standaloneBest={progress.standalonePlans[0] ?? null} squeezedBy={squeezedBy} />
          </div>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No program in the catalog prices this {goal.kind === "FLIGHT" ? "cabin" : "tier"} in{" "}
            {REGION_LABELS[goal.region]} yet.
          </p>
        )}
      </div>
    </li>
  );
}

function BookedGoalRow({ booked, index }: { booked: BookedGoal; index: number }) {
  const { goal, redemptions } = booked;
  // Points are only comparable within one unit, so a mixed miles/points trip shows a count.
  const units = new Set(redemptions.map((r) => r.program.pointsUnit));
  const spent = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0);
  return (
    <li
      className={`rise-in-item flex flex-wrap items-center justify-between gap-3 ${rowCardClass}`}
      style={riseInDelay(index)}
    >
      <div className="min-w-0">
        <Link
          href={`/goals/${goal.id}`}
          className="break-words font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
        >
          {booked.name}
        </Link>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {REGION_LABELS[goal.region]} · {describeGoal(goal)}
        </p>
      </div>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">Booked</span>
        {redemptions.length > 0 &&
          (units.size === 1
            ? ` · ${spent.toLocaleString("en-US")} ${[...units][0]}`
            : ` · ${redemptions.length} bookings`)}
      </p>
    </li>
  );
}
