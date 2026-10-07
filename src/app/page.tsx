import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getTopRedemptionOptionsForBalances } from "@/lib/redemptions/get-redemption-options";
import { formatCents, formatCentsPerPoint, programLabel } from "@/lib/format";
import { AddBalanceForm } from "@/components/balances/add-balance-form";
import { BalanceRowActions } from "@/components/balances/balance-row-actions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";
import { BalanceSparkline } from "@/components/balances/balance-sparkline";
import { CoinsIcon } from "@/components/icons";
import { describeGoal } from "@/lib/goals/cabins";
import { getGoalProgress } from "@/lib/goals/get-goal-progress";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { getExpirationStatus } from "@/lib/points-expiration";
import { getRedemptionSummary } from "@/lib/redemptions/get-redemptions";
import { rowCardClass, rowCardFrameClass } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { RegionScene } from "@/components/regions/region-scene";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";

// Balances change via API mutations after build, so this page must be
// re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await requireSessionUserId();

  const balances = await prisma.pointsBalance.findMany({
    where: { userId },
    include: {
      rewardsProgram: true,
      snapshots: { orderBy: { recordedAt: "desc" }, take: 12 },
    },
    orderBy: { rewardsProgram: { name: "asc" } },
  });

  const topOptions = await getTopRedemptionOptionsForBalances(
    balances.map((b) => ({ rewardsProgramId: b.rewardsProgramId, balance: b.balance }))
  );

  const allPrograms = await prisma.rewardsProgram.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, type: true, pointsUnit: true },
  });

  const goals = await prisma.awardGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 4,
  });
  const goalProgress = await Promise.all(goals.map((goal) => getGoalProgress(userId, goal)));

  const redemptions = await getRedemptionSummary(userId);

  const programIdsWithBalance = new Set(balances.map((b) => b.rewardsProgramId));
  const addablePrograms = allPrograms.filter((p) => !programIdsWithBalance.has(p.id));

  const totalPoints = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalValueCents = balances.reduce(
    (sum, b) => sum + (topOptions.get(b.rewardsProgramId)?.totalValueCents ?? 0),
    0
  );
  const expiringCount = balances.filter(
    (b) =>
      getExpirationStatus({
        lastUpdatedAt: b.lastUpdatedAt,
        expirationMonths: b.rewardsProgram.pointsExpirationMonths,
        overrideAt: b.expiresOverrideAt,
      }).status !== "none"
  ).length;

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={CoinsIcon} tone="emerald" title="Dashboard">
        Your reward point balances and the best way to use each one.
      </PageHeader>

      {balances.length > 0 && (
        <dl
          className={`grid divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50 ${
            redemptions.count > 0
              ? "grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0"
              : "grid-cols-3 divide-x"
          }`}
        >
          <div className="px-4 py-3">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Points held</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-2xl">
              <CountUp value={totalPoints} format="number" />
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Best-case value</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              <CountUp value={totalValueCents} format="cents" />
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">At risk</dt>
            <dd
              className={`font-display text-xl font-semibold tracking-tight sm:text-2xl ${
                expiringCount > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-black dark:text-zinc-50"
              }`}
            >
              {expiringCount === 0 ? "None" : `${expiringCount} of ${balances.length}`}
            </dd>
          </div>
          {redemptions.count > 0 && (
            <div className="px-4 py-3">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Realized</dt>
              <dd className="font-display text-xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-2xl">
                {formatCentsPerPoint(redemptions.blendedCentsPerPoint)}
              </dd>
            </div>
          )}
        </dl>
      )}

      {goals.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={sectionTitleClass}>Your goals</h2>
            <Link
              href="/goals"
              className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              All goals &rarr;
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {goals.map((goal, index) => {
              const best = goalProgress[index].plans[0] ?? null;
              return (
                <li
                  key={goal.id}
                  className={`rise-in-item ${rowCardFrameClass}`}
                  style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
                >
                  <RegionScene region={goal.region} className="h-20" />
                  <div className="flex flex-col gap-2 p-4">
                    <div className="min-w-0">
                      <Link
                        href={`/goals/${goal.id}`}
                        className="break-words font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                      >
                        {goal.label}
                      </Link>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {describeGoal(goal)}
                      </p>
                    </div>
                    {best ? (
                      <>
                        <GoalProgressBar
                          heldPoints={best.heldPoints}
                          pointsCovered={best.pointsCovered}
                          pointsNeeded={best.pointsNeeded}
                          label={`${goal.label} via ${programLabel(best.program)}`}
                        />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {best.isReachable ? (
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              Bookable via {programLabel(best.program)}
                            </span>
                          ) : (
                            <>
                              {Math.round((best.pointsCovered / best.pointsNeeded) * 100)}% via{" "}
                              {programLabel(best.program)} ·{" "}
                              {best.shortfall.toLocaleString("en-US")} short
                            </>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">No pricing yet</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your balances</h2>

        {balances.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <CoinsIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No balances yet — add one below to see your best redemption options.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {balances.map((balance, index) => {
              const top = topOptions.get(balance.rewardsProgramId);
              const history = balance.snapshots.map((s) => s.balance).reverse();
              const previous = history.length >= 2 ? history[history.length - 2] : null;
              const delta = previous === null ? null : balance.balance - previous;
              return (
                <li
                  key={balance.id}
                  className={`rise-in-item flex flex-col gap-3 ${rowCardClass}`}
                  style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <ProgramBadge
                        name={balance.rewardsProgram.name}
                        shortName={balance.rewardsProgram.shortName}
                        type={balance.rewardsProgram.type}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/programs/${balance.rewardsProgramId}`}
                          className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                        >
                          {programLabel(balance.rewardsProgram)}
                        </Link>
                        <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="font-display text-base font-semibold tabular-nums text-black dark:text-zinc-50">
                            {balance.balance.toLocaleString("en-US")}
                          </span>
                          {balance.rewardsProgram.pointsUnit}
                          {delta !== null && delta !== 0 && (
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                delta > 0
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {delta > 0 ? "+" : "−"}{Math.abs(delta).toLocaleString("en-US")}
                            </span>
                          )}
                          <BalanceSparkline values={history} />
                          <ExpirationPill
                            lastUpdatedAt={balance.lastUpdatedAt}
                            expirationMonths={balance.rewardsProgram.pointsExpirationMonths}
                            overrideAt={balance.expiresOverrideAt}
                          />
                        </p>
                      </div>
                    </div>

                    <BalanceRowActions
                      id={balance.id}
                      programName={programLabel(balance.rewardsProgram)}
                      currentBalance={balance.balance}
                      currentExpiresOverrideAt={balance.expiresOverrideAt}
                      pointsUnit={balance.rewardsProgram.pointsUnit}
                    />
                  </div>

                  <dl className="flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                    {top ? (
                      <>
                        <div className="flex gap-1.5">
                          <dt className="text-zinc-500 dark:text-zinc-400">Worth up to</dt>
                          <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                            {formatCents(top.totalValueCents)}
                          </dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="text-zinc-500 dark:text-zinc-400">Best use</dt>
                          <dd className="text-zinc-700 dark:text-zinc-300">
                            {top.kind === "direct" ? (
                              "direct redemption"
                            ) : (
                              <>
                                transfer to {top.partnerProgramName}
                                {top.activeBonusPercent ? (
                                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                    +{top.activeBonusPercent}% bonus
                                  </span>
                                ) : null}
                              </>
                            )}
                          </dd>
                        </div>
                      </>
                    ) : (
                      <div className="text-zinc-500 dark:text-zinc-400">No options available</div>
                    )}
                  </dl>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
        <div>
          <h2 className={sectionTitleClass}>Add a balance</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track another program to see where its points are worth the most.
          </p>
        </div>
        <AddBalanceForm programs={addablePrograms} />
      </section>
    </div>
  );
}
