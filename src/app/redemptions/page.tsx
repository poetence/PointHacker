import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents, formatCentsPerPoint, programLabel } from "@/lib/format";
import { getRedemptions } from "@/lib/redemptions/get-redemptions";
import { sortProgramsByPriority } from "@/lib/program-priority";
import { AddRedemptionForm } from "@/components/redemptions/add-redemption-form";
import { DeleteButton } from "@/components/ui/delete-button";
import { ProgramBadge } from "@/components/programs/program-badge";
import { TicketIcon } from "@/components/icons";
import { rowCardClass } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";

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
        <dl className="grid grid-cols-3 divide-x divide-zinc-200 rounded-xl border border-zinc-200 bg-white shadow-sm dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="px-4 py-3">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Points redeemed</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-2xl">
              <CountUp value={summary.totalPointsSpent} format="number" />
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Value realized</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              <CountUp value={summary.totalNetValueCents} format="cents" />
            </dd>
          </div>
          <div className="px-4 py-3">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Blended rate</dt>
            <dd className="font-display text-xl font-semibold tracking-tight text-black dark:text-zinc-50 sm:text-2xl">
              {formatCentsPerPoint(summary.blendedCentsPerPoint)}
            </dd>
          </div>
        </dl>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>History</h2>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <TicketIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nothing logged yet — record a booking below to see what your points really earned.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <li
                key={row.id}
                className={`rise-in-item flex flex-col gap-3 ${rowCardClass}`}
                style={{ animationDelay: `${Math.min(index, 6) * 50}ms` }}
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

                <dl className="flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                  <div className="flex gap-1.5">
                    <dt className="text-zinc-500 dark:text-zinc-400">Spent</dt>
                    <dd className="text-zinc-700 tabular-nums dark:text-zinc-300">
                      {row.pointsSpent.toLocaleString("en-US")} {row.program.pointsUnit}
                    </dd>
                  </div>
                  <div className="flex gap-1.5">
                    <dt className="text-zinc-500 dark:text-zinc-400">Worth</dt>
                    <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCents(row.cashValueCents)}
                    </dd>
                  </div>
                  {row.feesPaidCents > 0 && (
                    <div className="flex gap-1.5">
                      <dt className="text-zinc-500 dark:text-zinc-400">Fees</dt>
                      <dd className="text-zinc-700 dark:text-zinc-300">
                        {formatCents(row.feesPaidCents)}
                      </dd>
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <dt className="text-zinc-500 dark:text-zinc-400">vs. estimate</dt>
                    <dd
                      className={
                        row.vsBaseline.beatBaseline
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }
                    >
                      {row.vsBaseline.deltaPercent >= 0 ? "+" : "−"}
                      {Math.abs(Math.round(row.vsBaseline.deltaPercent))}% vs{" "}
                      {formatCentsPerPoint(row.vsBaseline.baselineCentsPerPoint)}
                    </dd>
                  </div>
                </dl>
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
