import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import { getRedemptionOptionsForProgram } from "@/lib/redemptions/get-redemption-options";
import { formatCents, formatCentsPerPoint } from "@/lib/format";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const program = await prisma.rewardsProgram.findUnique({ where: { id } });
  if (!program) {
    notFound();
  }

  const pointsBalance = await prisma.pointsBalance.findUnique({
    where: { userId_rewardsProgramId: { userId: DEFAULT_USER_ID, rewardsProgramId: id } },
  });
  const balance = pointsBalance?.balance ?? 0;

  const options = await getRedemptionOptionsForProgram(id, balance);

  const cards = await prisma.creditCard.findMany({
    where: { userId: DEFAULT_USER_ID, rewardsProgramId: id },
    orderBy: [{ issuer: "asc" }],
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <div>
        <Link href="/" className="text-sm text-zinc-500 underline dark:text-zinc-400">
          &larr; Back to dashboard
        </Link>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          {program.name}
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {balance.toLocaleString()} points &middot; direct value{" "}
          {formatCentsPerPoint(Number(program.defaultRedemptionValueCents))}/point
        </p>
        {pointsBalance === null && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            You don&apos;t have a balance tracked for this program yet — options below assume 0
            points. Add a balance from the dashboard to see real numbers.
          </p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Redemption options, ranked
        </h2>

        <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {options.map((option, index) => (
            <li
              key={option.kind === "direct" ? "direct" : option.partnerProgramId}
              className={`flex flex-wrap items-center justify-between gap-3 py-4 ${
                option.kind === "transfer" && !option.isViable ? "opacity-50" : ""
              }`}
            >
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  #{index + 1}{" "}
                  {option.kind === "direct" ? "Direct redemption" : `Transfer to ${option.partnerProgramName}`}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {option.kind === "direct"
                    ? `${option.pointsUsed.toLocaleString()} points used`
                    : `${option.pointsUsed.toLocaleString()} points -> ${option.pointsReceived.toLocaleString()} received${
                        option.transferFeeCents > 0
                          ? ` · ${formatCents(option.transferFeeCents)} fee`
                          : ""
                      }`}
                </p>
                {option.kind === "transfer" && !option.isViable && (
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {option.minimumTransfer !== null
                      ? `Requires at least ${option.minimumTransfer.toLocaleString()} points to transfer.`
                      : "Not enough points for a full transfer block."}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="font-medium text-black dark:text-zinc-50">
                  {formatCents(option.totalValueCents)}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCentsPerPoint(option.valuePerPointCents)}/point
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Cards earning this program
        </h2>

        {cards.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No cards tracked for this program yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {cards.map((card) => (
              <li key={card.id} className="py-2 text-sm text-zinc-700 dark:text-zinc-300">
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
