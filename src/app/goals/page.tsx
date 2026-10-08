import Link from "next/link";
import type { AwardGoal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { REGION_LABELS } from "@/lib/regions";
import { describeGoal } from "@/lib/goals/cabins";
import { getGoalProgress } from "@/lib/goals/get-goal-progress";
import { GoalForm } from "@/components/goals/goal-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { TargetIcon } from "@/components/icons";
import { riseInDelay, rowCardFrameClass } from "@/components/ui/card";
import { RegionScene } from "@/components/regions/region-scene";
import { programLabel } from "@/lib/format";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { percentCovered, type GoalTargetPlan } from "@/lib/goals/compute-goal-progress";

// Goals and balances change via API mutations after build, so this page must
// be re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const userId = await requireSessionUserId();

  const goals = await prisma.awardGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const progress = await Promise.all(goals.map((goal) => getGoalProgress(userId, goal)));

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={TargetIcon} tone="rose" title="Award goals">
        Name the trip, and see how close your points already get you.
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Set a goal</h2>
        <GoalForm defaultOriginState={goals.find((g) => g.originState)?.originState ?? ""} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your goals</h2>

        {goals.length === 0 ? (
          <EmptyState icon={TargetIcon}>
            No goals yet — set one above to see which of your balances get you there.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {goals.map((goal, index) => (
              <GoalRow key={goal.id} goal={goal} best={progress[index].plans[0] ?? null} index={index} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function GoalRow({ goal, best, index }: { goal: AwardGoal; best: GoalTargetPlan | null; index: number }) {
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
