import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getTopRedemptionOptionsForBalances } from "@/lib/redemptions/get-redemption-options";
import { formatCents, formatCentsPerPoint, formatSignedCount, programLabel } from "@/lib/format";
import { AddBalanceForm } from "@/components/balances/add-balance-form";
import { BalanceRowActions } from "@/components/balances/balance-row-actions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";
import { BalanceSparkline } from "@/components/balances/balance-sparkline";
import { CoinsIcon } from "@/components/icons";
import { describeGoal } from "@/lib/goals/cabins";
import { getGoalsProgress, type GoalProgress } from "@/lib/goals/get-goal-progress";
import { percentCovered } from "@/lib/goals/compute-goal-progress";
import { SharedPointsNote } from "@/components/goals/shared-points-note";
import type { RedemptionOption } from "@/lib/redemptions/compute-best-redemptions";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { getExpirationStatus } from "@/lib/points-expiration";
import { getRedemptionSummary } from "@/lib/redemptions/get-redemptions";
import { riseInDelay, rowCardClass, rowCardFrameClass } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { RegionScene } from "@/components/regions/region-scene";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat, StatsStrip } from "@/components/ui/stats-strip";
import { Breakdown, BreakdownItem } from "@/components/ui/breakdown";
import { BonusPill } from "@/components/promos/bonus-pill";

// Balances change via API mutations after build, so this page must be
// re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await requireSessionUserId();

  const balances = await findBalances(userId);

  const topOptions = await getTopRedemptionOptionsForBalances(
    balances.map((b) => ({ rewardsProgramId: b.rewardsProgramId, balance: b.balance }))
  );

  const allPrograms = await prisma.rewardsProgram.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, type: true, pointsUnit: true },
  });

  // Every goal is planned (they share balances), but only the newest four are shown.
  const goals = (await getGoalsProgress(userId)).goals.slice(0, 4);

  const redemptions = await getRedemptionSummary(userId);

  const programIdsWithBalance = new Set(balances.map((b) => b.rewardsProgramId));
  const addablePrograms = allPrograms.filter((p) => !programIdsWithBalance.has(p.id));

  const totalPoints = balances.reduce((sum, b) => sum + b.balance, 0);
  const totalValueCents = balances.reduce(
    (sum, b) => sum + (topOptions.get(b.rewardsProgramId)?.totalValueCents ?? 0),
    0
  );
  const expiringCount = balances.filter(isAtRisk).length;

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={CoinsIcon} tone="emerald" title="Dashboard">
        Your reward point balances and the best way to use each one.
      </PageHeader>

      {balances.length > 0 && (
        <StatsStrip
          className={
            redemptions.count > 0
              ? "grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0"
              : "grid-cols-3 divide-x"
          }
        >
          <Stat label="Points held">
            <CountUp value={totalPoints} format="number" />
          </Stat>
          <Stat label="Best-case value" tone="positive">
            <CountUp value={totalValueCents} format="cents" />
          </Stat>
          <Stat label="At risk" tone={expiringCount > 0 ? "warning" : "default"}>
            {expiringCount === 0 ? "None" : `${expiringCount} of ${balances.length}`}
          </Stat>
          {redemptions.count > 0 && (
            <Stat label="Realized">{formatCentsPerPoint(redemptions.blendedCentsPerPoint)}</Stat>
          )}
        </StatsStrip>
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
            {goals.map((progress, index) => (
              <GoalCard key={progress.goal.id} progress={progress} index={index} />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your balances</h2>

        {balances.length === 0 ? (
          <EmptyState icon={CoinsIcon}>
            No balances yet — add one below to see your best redemption options.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {balances.map((balance, index) => (
              <BalanceRow
                key={balance.id}
                balance={balance}
                top={topOptions.get(balance.rewardsProgramId) ?? null}
                index={index}
              />
            ))}
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

function findBalances(userId: string) {
  return prisma.pointsBalance.findMany({
    where: { userId },
    include: {
      rewardsProgram: true,
      snapshots: { orderBy: { recordedAt: "desc" }, take: 12 },
    },
    orderBy: { rewardsProgram: { name: "asc" } },
  });
}

type DashboardBalance = Awaited<ReturnType<typeof findBalances>>[number];

function isAtRisk(balance: DashboardBalance): boolean {
  return (
    getExpirationStatus({
      lastUpdatedAt: balance.lastUpdatedAt,
      expirationMonths: balance.rewardsProgram.pointsExpirationMonths,
      overrideAt: balance.expiresOverrideAt,
    }).status !== "none"
  );
}

/** Snapshot balances oldest first, and the change since the one before the latest (null with no history). */
function recentHistory(balance: DashboardBalance) {
  const history = balance.snapshots.map((s) => s.balance).reverse();
  const previous = history.length >= 2 ? history[history.length - 2] : null;
  const delta = previous === null ? null : balance.balance - previous;
  return { history, delta };
}

function GoalCard({ progress, index }: { progress: GoalProgress; index: number }) {
  const { goal, squeezedBy } = progress;
  const best = progress.shared.plans[0] ?? null;
  return (
    <li className={`rise-in-item ${rowCardFrameClass}`} style={riseInDelay(index)}>
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
                  {percentCovered(best)}% via{" "}
                  {programLabel(best.program)} ·{" "}
                  {best.shortfall.toLocaleString("en-US")} short
                </>
              )}
            </p>
            <SharedPointsNote
              standaloneBest={progress.standalonePlans[0] ?? null}
              squeezedBy={squeezedBy}
              className="text-xs"
            />
          </>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">No pricing yet</p>
        )}
      </div>
    </li>
  );
}

function BalanceRow({
  balance,
  top,
  index,
}: {
  balance: DashboardBalance;
  top: RedemptionOption | null;
  index: number;
}) {
  const { history, delta } = recentHistory(balance);
  return (
    <li className={`rise-in-item flex flex-col gap-3 ${rowCardClass}`} style={riseInDelay(index)}>
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
                  {formatSignedCount(delta)}
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

      <Breakdown>
        {top ? (
          <>
            <BreakdownItem
              label="Worth up to"
              valueClassName="font-medium text-emerald-600 dark:text-emerald-400"
            >
              {formatCents(top.totalValueCents)}
            </BreakdownItem>
            <BreakdownItem label="Best use" valueClassName="text-zinc-700 dark:text-zinc-300">
              {top.kind === "direct" ? (
                "direct redemption"
              ) : (
                <>
                  transfer to {top.partnerProgramName}
                  {top.activeBonusPercent ? <BonusPill>+{top.activeBonusPercent}% bonus</BonusPill> : null}
                </>
              )}
            </BreakdownItem>
          </>
        ) : (
          <div className="text-zinc-500 dark:text-zinc-400">No options available</div>
        )}
      </Breakdown>
    </li>
  );
}
