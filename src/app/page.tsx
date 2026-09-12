import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";
import { getTopRedemptionOptionsForBalances } from "@/lib/redemptions/get-redemption-options";
import { formatCents } from "@/lib/format";
import { AddBalanceForm } from "@/components/balances/add-balance-form";
import { BalanceRowActions } from "@/components/balances/balance-row-actions";

// Balances change via API mutations after build, so this page must be
// re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const balances = await prisma.pointsBalance.findMany({
    where: { userId: DEFAULT_USER_ID },
    include: { rewardsProgram: true },
    orderBy: { rewardsProgram: { name: "asc" } },
  });

  const topOptions = await getTopRedemptionOptionsForBalances(
    balances.map((b) => ({ rewardsProgramId: b.rewardsProgramId, balance: b.balance }))
  );

  const allPrograms = await prisma.rewardsProgram.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true },
  });

  const programIdsWithBalance = new Set(balances.map((b) => b.rewardsProgramId));
  const addablePrograms = allPrograms.filter((p) => !programIdsWithBalance.has(p.id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          PointHacker
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your reward point balances and the best way to use each one.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add a balance
        </h2>
        <AddBalanceForm programs={addablePrograms} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Your balances
        </h2>

        {balances.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No balances yet — add one above to see your best redemption options.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {balances.map((balance) => {
              const top = topOptions.get(balance.rewardsProgramId);
              return (
                <li key={balance.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <Link
                      href={`/programs/${balance.rewardsProgramId}`}
                      className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                    >
                      {balance.rewardsProgram.shortName ?? balance.rewardsProgram.name}
                    </Link>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {balance.balance.toLocaleString()} points
                    </p>
                  </div>

                  <div className="text-right">
                    {top ? (
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        {formatCents(top.totalValueCents)} —{" "}
                        {top.kind === "direct" ? "direct redemption" : `transfer to ${top.partnerProgramName}`}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No options available</p>
                    )}
                  </div>

                  <BalanceRowActions id={balance.id} currentBalance={balance.balance} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
