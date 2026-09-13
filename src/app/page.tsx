import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getTopRedemptionOptionsForBalances } from "@/lib/redemptions/get-redemption-options";
import { formatCents } from "@/lib/format";
import { AddBalanceForm } from "@/components/balances/add-balance-form";
import { BalanceRowActions } from "@/components/balances/balance-row-actions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";
import { CoinsIcon } from "@/components/icons";

// Balances change via API mutations after build, so this page must be
// re-rendered per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await requireSessionUserId();

  const balances = await prisma.pointsBalance.findMany({
    where: { userId },
    include: { rewardsProgram: true },
    orderBy: { rewardsProgram: { name: "asc" } },
  });

  const topOptions = await getTopRedemptionOptionsForBalances(
    balances.map((b) => ({ rewardsProgramId: b.rewardsProgramId, balance: b.balance }))
  );

  const allPrograms = await prisma.rewardsProgram.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true, type: true },
  });

  const programIdsWithBalance = new Set(balances.map((b) => b.rewardsProgramId));
  const addablePrograms = allPrograms.filter((p) => !programIdsWithBalance.has(p.id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 shadow-sm dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300">
          <CoinsIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Your reward point balances and the best way to use each one.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Add a balance
        </h2>
        <AddBalanceForm programs={addablePrograms} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Your balances
        </h2>

        {balances.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <CoinsIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No balances yet — add one above to see your best redemption options.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {balances.map((balance) => {
              const top = topOptions.get(balance.rewardsProgramId);
              return (
                <li
                  key={balance.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center gap-3">
                    <ProgramBadge
                      name={balance.rewardsProgram.name}
                      shortName={balance.rewardsProgram.shortName}
                      type={balance.rewardsProgram.type}
                      size="sm"
                    />
                    <div>
                      <Link
                        href={`/programs/${balance.rewardsProgramId}`}
                        className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                      >
                        {balance.rewardsProgram.shortName ?? balance.rewardsProgram.name}
                      </Link>
                      <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {balance.balance.toLocaleString()} points
                        <ExpirationPill
                          lastUpdatedAt={balance.lastUpdatedAt}
                          expirationMonths={balance.rewardsProgram.pointsExpirationMonths}
                          overrideAt={balance.expiresOverrideAt}
                        />
                      </p>
                    </div>
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

                  <BalanceRowActions
                    id={balance.id}
                    currentBalance={balance.balance}
                    currentExpiresOverrideAt={balance.expiresOverrideAt}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
