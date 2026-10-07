import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents, formatCentsPerPoint, programLabel } from "@/lib/format";
import { getRedemptions } from "@/lib/redemptions/get-redemptions";
import { sortProgramsByPriority } from "@/lib/program-priority";
import { AddRedemptionForm } from "@/components/redemptions/add-redemption-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { ProgramBadge } from "@/components/programs/program-badge";
import { TicketIcon } from "@/components/icons";
import { riseInDelay, rowCardClass } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat, StatsStrip } from "@/components/ui/stats-strip";
import { Breakdown, BreakdownItem } from "@/components/ui/breakdown";

// Redemptions mutate via the API after build, so this page must be re-rendered
// per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default async function RedemptionsPage() {
  const userId = await requireSessionUserId();

  const [{ rows, summary }, programs, balances, goals] = await Promise.all([
    getRedemptions(userId),
    prisma.rewardsProgram.findMany({
      where: { isActive: true },
      select: { id: true, name: true, shortName: true, type: true, pointsUnit: true },
    }),
    prisma.pointsBalance.findMany({ where: { userId }, select: { rewardsProgramId: true, balance: true } }),
    prisma.awardGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true },
    }),
  ]);

  const balanceByProgram = new Map(balances.map((b) => [b.rewardsProgramId, b.balance]));
  const programTypeById = new Map(programs.map((p) => [p.id, p.type]));

  // Programs the user actually holds come first, each group in catalog order.
  const prioritized = sortProgramsByPriority(programs);
  const programOptions = [
    ...prioritized.filter((p) => balanceByProgram.has(p.id)),
    ...prioritized.filter((p) => !balanceByProgram.has(p.id)),
  ].map((p) => ({
      id: p.id,
      name: programLabel(p),
      pointsUnit: p.pointsUnit,
      balance: balanceByProgram.get(p.id) ?? null,
    }));

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={TicketIcon} tone="sky" title="Redemptions">
        What you actually booked, and what your points were really worth.
      </PageHeader>

      {summary.count > 0 && (
        <StatsStrip className="grid-cols-3 divide-x">
          <Stat label="Points redeemed">
            <CountUp value={summary.totalPointsSpent} format="number" />
          </Stat>
          <Stat label="Value realized" tone="positive">
            <CountUp value={summary.totalNetValueCents} format="cents" />
          </Stat>
          <Stat label="Blended rate">{formatCentsPerPoint(summary.blendedCentsPerPoint)}</Stat>
        </StatsStrip>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>History</h2>

        {rows.length === 0 ? (
          <EmptyState icon={TicketIcon}>
            Nothing logged yet — record a booking below to see what your points really earned.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li
                key={row.id}
                className={`rise-in-item flex flex-col gap-3 ${rowCardClass}`}
                style={riseInDelay(index)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProgramBadge
                      name={row.program.name}
                      shortName={row.program.shortName}
                      type={programTypeById.get(row.program.id) ?? "OTHER"}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="break-words font-medium text-black dark:text-zinc-50">{row.description}</p>
                      <p className="break-words text-sm text-zinc-500 dark:text-zinc-400">
                        {programLabel(row.program)} ·{" "}
                        {dateFormat.format(row.bookedOn)}
                        {row.goal && ` · for ${row.goal.label}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p
                      className={`font-display text-lg font-semibold ${
                        row.vsBaseline.beatBaseline
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {formatCentsPerPoint(row.centsPerPoint)}
                    </p>
                    {/* Says what it won't do: the balance stays put, since the user may
                        have corrected it since and putting points back would double-count. */}
                    <DeleteButton
                      url={`/api/redemptions/${row.id}`}
                      itemLabel={`redemption: ${row.description}`}
                      confirmMessage="Remove this redemption? Your balance won't be changed back."
                    />
                  </div>
                </div>

                <Breakdown>
                  <BreakdownItem
                    label="Spent"
                    valueClassName="text-zinc-700 tabular-nums dark:text-zinc-300"
                  >
                    {row.pointsSpent.toLocaleString("en-US")} {row.program.pointsUnit}
                  </BreakdownItem>
                  <BreakdownItem
                    label="Worth"
                    valueClassName="font-medium text-emerald-600 dark:text-emerald-400"
                  >
                    {formatCents(row.cashValueCents)}
                  </BreakdownItem>
                  {row.feesPaidCents > 0 && (
                    <BreakdownItem label="Fees" valueClassName="text-zinc-700 dark:text-zinc-300">
                      {formatCents(row.feesPaidCents)}
                    </BreakdownItem>
                  )}
                  <BreakdownItem
                    label="vs. estimate"
                    valueClassName={
                      row.vsBaseline.beatBaseline
                        ? "font-medium text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    }
                  >
                    {row.vsBaseline.deltaPercent >= 0 ? "+" : "−"}
                    {Math.abs(Math.round(row.vsBaseline.deltaPercent))}% vs{" "}
                    {formatCentsPerPoint(row.vsBaseline.baselineCentsPerPoint)}
                  </BreakdownItem>
                </Breakdown>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
        <div>
          <h2 className={sectionTitleClass}>Log a redemption</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Record what you booked to see the rate you actually got.
          </p>
        </div>
        <AddRedemptionForm programs={programOptions} goals={goals} />
      </section>
    </div>
  );
}
