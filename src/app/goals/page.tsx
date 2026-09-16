import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { REGION_LABELS } from "@/lib/regions";
import { describeGoal } from "@/lib/goals/cabins";
import { getGoalProgress } from "@/lib/goals/get-goal-progress";
import { GoalForm } from "@/components/goals/goal-form";
import { GoalDeleteButton } from "@/components/goals/goal-actions";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { TargetIcon } from "@/components/icons";

// Goals and balances change via API mutations after build, so this page must
// be re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

const sectionTitle =
  "font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50";

export default async function GoalsPage() {
  const userId = await requireSessionUserId();

  const goals = await prisma.awardGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const progress = await Promise.all(goals.map((goal) => getGoalProgress(userId, goal)));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-rose-50 text-rose-700 shadow-sm dark:from-rose-950 dark:to-rose-900 dark:text-rose-300">
          <TargetIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Award goals
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Name the trip, and see how close your points already get you.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className={sectionTitle}>Set a goal</h2>
        <GoalForm defaultOriginState={goals.find((g) => g.originState)?.originState ?? ""} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className={sectionTitle}>Your goals</h2>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <TargetIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No goals yet — set one above to see which of your balances get you there.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {goals.map((goal, index) => {
              const best = progress[index].plans[0] ?? null;
              return (
                <li
                  key={goal.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/goals/${goal.id}`}
                        className="font-display text-lg font-semibold text-black underline-offset-2 hover:underline dark:text-zinc-50"
                      >
                        {goal.label}
                      </Link>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {REGION_LABELS[goal.region]} · {describeGoal(goal)}
                      </p>
                    </div>
                    <GoalDeleteButton goalId={goal.id} />
                  </div>

                  {best ? (
                    <div className="flex flex-col gap-1.5">
                      <GoalProgressBar
                        heldPoints={best.heldPoints}
                        pointsCovered={best.pointsCovered}
                        pointsNeeded={best.pointsNeeded}
                      />
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {best.isReachable ? (
                          <>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              Bookable now
                            </span>{" "}
                            via {best.program.shortName ?? best.program.name} —{" "}
                            {best.pointsNeeded.toLocaleString()} {best.program.pointsUnit}
                          </>
                        ) : (
                          <>
                            Closest: {best.program.shortName ?? best.program.name} —{" "}
                            {best.pointsCovered.toLocaleString()} of{" "}
                            {best.pointsNeeded.toLocaleString()} {best.program.pointsUnit} (
                            {Math.round((best.pointsCovered / best.pointsNeeded) * 100)}%)
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
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
