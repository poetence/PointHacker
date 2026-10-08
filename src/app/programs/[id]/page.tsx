import Link from "next/link";
import type { BalanceSnapshot } from "@prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getRedemptionOptionsForProgram } from "@/lib/redemptions/get-redemption-options";
import { formatCents, formatCentsPerPoint, formatSignedCount, unitLabel, unitSingular } from "@/lib/format";
import type {
  RedemptionOption,
  TransferRedemptionOption,
} from "@/lib/redemptions/compute-best-redemptions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";
import { rowCardClass } from "@/components/ui/card";
import { LocalDate } from "@/components/ui/local-date";
import { pageContainerClass } from "@/components/ui/page-header";
import { pageTitleClass, sectionTitleClass } from "@/components/ui/text";
import { BonusPill } from "@/components/promos/bonus-pill";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requireSessionUserId();

  const program = await prisma.rewardsProgram.findUnique({ where: { id } });
  if (!program) {
    notFound();
  }

  const pointsBalance = await prisma.pointsBalance.findUnique({
    where: { userId_rewardsProgramId: { userId, rewardsProgramId: id } },
    include: { snapshots: { orderBy: { recordedAt: "desc" }, take: 50 } },
  });
  const balance = pointsBalance?.balance ?? 0;

  const options = await getRedemptionOptionsForProgram(id, balance);

  const cards = await prisma.creditCard.findMany({
    where: { userId, rewardsProgramId: id },
    orderBy: [{ issuer: "asc" }],
  });

  return (
    <div className={pageContainerClass}>
      <div>
        <Link href="/" className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          &larr; Back to dashboard
        </Link>
      </div>

      <header className="flex items-center gap-4">
        <ProgramBadge name={program.name} shortName={program.shortName} type={program.type} />
        <div>
          <h1 className={pageTitleClass}>{program.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-400">
            {balance.toLocaleString("en-US")} {program.pointsUnit} &middot; direct value{" "}
            {formatCentsPerPoint(Number(program.defaultRedemptionValueCents))}/{unitSingular(program.pointsUnit)}
            {pointsBalance && (
              <ExpirationPill
                lastUpdatedAt={pointsBalance.lastUpdatedAt}
                expirationMonths={program.pointsExpirationMonths}
                overrideAt={pointsBalance.expiresOverrideAt}
              />
            )}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {program.pointsExpirationMonths
              ? `Expires after ${program.pointsExpirationMonths} months without activity.`
              : `${unitLabel(program.pointsUnit)} don't expire (or no known inactivity policy).`}
          </p>
          {pointsBalance === null && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              You don&apos;t have a balance tracked for this program yet — options below assume 0
              {program.pointsUnit}. Add a balance from the dashboard to see real numbers.
            </p>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Redemption options, ranked</h2>

        <ul className="flex flex-col gap-3">
          {options.map((option, index) => (
            <OptionRow
              key={option.kind === "direct" ? "direct" : option.partnerProgramId}
              option={option}
              index={index}
              pointsUnit={program.pointsUnit}
            />
          ))}
        </ul>
      </section>

      {pointsBalance && pointsBalance.snapshots.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Balance history</h2>
          <ul className="flex flex-col gap-2">
            {pointsBalance.snapshots.map((snapshot, index) => (
              <HistoryRow
                key={snapshot.id}
                snapshot={snapshot}
                older={pointsBalance.snapshots[index + 1]}
                pointsUnit={program.pointsUnit}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Cards earning this program</h2>

        {cards.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No cards tracked for this program yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300"
              >
                {card.issuer} {card.productName}
                {card.nickname && (
                  <span className="text-zinc-500 dark:text-zinc-400"> ({card.nickname})</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function OptionRow({
  option,
  index,
  pointsUnit,
}: {
  option: RedemptionOption;
  index: number;
  pointsUnit: string;
}) {
  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 ${rowCardClass} ${
        option.kind === "transfer" && !option.isViable ? "border-dashed shadow-none" : ""
      } ${index === 0 ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : ""}`}
    >
      <div>
        <p className="font-medium text-black dark:text-zinc-50">
          #{index + 1}{" "}
          {option.kind === "direct" ? "Direct redemption" : `Transfer to ${option.partnerProgramName}`}
          {option.kind === "transfer" && option.activeBonusPercent && (
            <BonusPill>+{option.activeBonusPercent}% bonus</BonusPill>
          )}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {describeUsage(option, pointsUnit)}
        </p>
        {option.kind === "transfer" && !option.isViable && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            {nonViableReason(option, pointsUnit)}
          </p>
        )}
      </div>

      <div className="text-right">
        <p className="font-medium text-black dark:text-zinc-50">
          {formatCents(option.totalValueCents)}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatCentsPerPoint(option.valuePerPointCents)}/{unitSingular(pointsUnit)}
        </p>
      </div>
    </li>
  );
}

/** "50,000 points used", or for a transfer "50,000 points → 50,000 received · $5.00 fee". */
function describeUsage(option: RedemptionOption, pointsUnit: string): string {
  const used = `${option.pointsUsed.toLocaleString("en-US")} ${pointsUnit}`;
  if (option.kind === "direct") return `${used} used`;

  const fee = option.transferFeeCents > 0 ? ` · ${formatCents(option.transferFeeCents)} fee` : "";
  return `${used} → ${option.pointsReceived.toLocaleString("en-US")} received${fee}`;
}

/** Why a transfer can't happen at this balance. */
function nonViableReason(option: TransferRedemptionOption, pointsUnit: string): string {
  return option.minimumTransfer !== null
    ? `Requires at least ${option.minimumTransfer.toLocaleString("en-US")} ${pointsUnit} to transfer.`
    : `Not enough ${pointsUnit} for a full transfer block.`;
}

/** One snapshot of the balance, with the change from the snapshot before it. */
function HistoryRow({
  snapshot,
  older,
  pointsUnit,
}: {
  snapshot: BalanceSnapshot;
  older: BalanceSnapshot | undefined;
  pointsUnit: string;
}) {
  const change = older ? snapshot.balance - older.balance : null;
  return (
    <li
      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
    >
      <span className="text-zinc-500 dark:text-zinc-400">
        <LocalDate iso={snapshot.recordedAt.toISOString()} />
      </span>
      <span className="flex items-center gap-3">
        {change !== null && change !== 0 && (
          <span
            className={
              change > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-400 dark:text-zinc-500"
            }
          >
            {formatSignedCount(change)}
          </span>
        )}
        <span className="font-medium text-black dark:text-zinc-50">
          {snapshot.balance.toLocaleString("en-US")} {pointsUnit}
        </span>
      </span>
    </li>
  );
}

