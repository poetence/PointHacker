import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getRedemptionOptionsForProgram } from "@/lib/redemptions/get-redemption-options";
import { formatCents, formatCentsPerPoint } from "@/lib/format";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";

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
  const unitSingular = program.pointsUnit === "miles" ? "mile" : "point";

  const cards = await prisma.creditCard.findMany({
    where: { userId, rewardsProgramId: id },
    orderBy: [{ issuer: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/" className="text-sm text-zinc-500 underline dark:text-zinc-400">
          &larr; Back to dashboard
        </Link>
      </div>

      <header className="flex items-center gap-4">
        <ProgramBadge name={program.name} shortName={program.shortName} type={program.type} />
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            {program.name}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-zinc-600 dark:text-zinc-400">
            {balance.toLocaleString()} {program.pointsUnit} &middot; direct value{" "}
            {formatCentsPerPoint(Number(program.defaultRedemptionValueCents))}/{unitSingular}
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
              : `${program.pointsUnit === "miles" ? "Miles" : "Points"} don't expire (or no known inactivity policy).`}
          </p>
          {pointsBalance === null && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              You don&apos;t have a balance tracked for this program yet — options below assume 0
              {program.pointsUnit}. Add a balance from the dashboard to see real numbers.
            </p>
          )}
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Redemption options, ranked
        </h2>

        <ul className="flex flex-col gap-3">
          {options.map((option, index) => (
            <li
              key={option.kind === "direct" ? "direct" : option.partnerProgramId}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 ${
                option.kind === "transfer" && !option.isViable ? "opacity-50" : ""
              } ${index === 0 ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : ""}`}
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  #{index + 1}{" "}
                  {option.kind === "direct" ? "Direct redemption" : `Transfer to ${option.partnerProgramName}`}
                  {option.kind === "transfer" && option.activeBonusPercent && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      +{option.activeBonusPercent}% bonus
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {option.kind === "direct"
                    ? `${option.pointsUsed.toLocaleString()} ${program.pointsUnit} used`
                    : `${option.pointsUsed.toLocaleString()} ${program.pointsUnit} -> ${option.pointsReceived.toLocaleString()} received${
                        option.transferFeeCents > 0
                          ? ` · ${formatCents(option.transferFeeCents)} fee`
                          : ""
                      }`}
                </p>
                {option.kind === "transfer" && !option.isViable && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {option.minimumTransfer !== null
                      ? `Requires at least ${option.minimumTransfer.toLocaleString()} ${program.pointsUnit} to transfer.`
                      : `Not enough ${program.pointsUnit} for a full transfer block.`}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-medium text-black dark:text-zinc-50">
                  {formatCents(option.totalValueCents)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCentsPerPoint(option.valuePerPointCents)}/{unitSingular}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {pointsBalance && pointsBalance.snapshots.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
            Balance history
          </h2>
          <ul className="flex flex-col gap-2">
            {pointsBalance.snapshots.map((snapshot, index) => {
              const older = pointsBalance.snapshots[index + 1];
              const change = older ? snapshot.balance - older.balance : null;
              return (
                <li
                  key={snapshot.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {snapshot.recordedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
                        {change > 0 ? "+" : "−"}{Math.abs(change).toLocaleString()}
                      </span>
                    )}
                    <span className="font-medium text-black dark:text-zinc-50">
                      {snapshot.balance.toLocaleString()} {program.pointsUnit}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Cards earning this program
        </h2>

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
