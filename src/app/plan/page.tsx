import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getRegionRedemptionOptions } from "@/lib/redemptions/get-region-redemption-options";
import { formatCents } from "@/lib/format";
import { ALL_REGIONS, REGION_LABELS, isRegion } from "@/lib/regions";
import type { RedemptionOption } from "@/lib/redemptions/compute-best-redemptions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";
import { CompassIcon } from "@/components/icons";

// Balances mutate via the API after build, so this page must be re-rendered
// per request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region: rawRegion } = await searchParams;
  const region = rawRegion && isRegion(rawRegion) ? rawRegion : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 text-violet-700 shadow-sm dark:from-violet-950 dark:to-violet-900 dark:text-violet-300">
          <CompassIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Plan a trip
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Pick a region to see which of your balances are actually worth using there.
          </p>
        </div>
      </header>

      <form method="GET" className="flex items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Region
          <select
            name="region"
            defaultValue={region ?? ""}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="" disabled>
              Choose a region
            </option>
            {ALL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Show options
        </button>
      </form>

      {region ? (
        <PlanResults region={region} />
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Pick a region above to see your best options there.
        </p>
      )}
    </div>
  );
}

async function PlanResults({ region }: { region: keyof typeof REGION_LABELS }) {
  const userId = await requireSessionUserId();

  const balances = await prisma.pointsBalance.findMany({
    where: { userId },
    include: { rewardsProgram: true },
  });

  if (balances.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        You don&apos;t have any balances tracked yet — add some from the dashboard first.
      </p>
    );
  }

  const options = await getRegionRedemptionOptions(
    balances.map((b) => ({ rewardsProgramId: b.rewardsProgramId, balance: b.balance })),
    region
  );

  type RankedRow = { balance: (typeof balances)[number]; option: RedemptionOption };

  const ranked: RankedRow[] = balances
    .map((balance) => ({ balance, option: options.get(balance.rewardsProgramId) ?? null }))
    .filter((row): row is RankedRow => row.option !== null)
    .sort((a, b) => b.option.totalValueCents - a.option.totalValueCents);

  const excluded = balances.filter((balance) => (options.get(balance.rewardsProgramId) ?? null) === null);

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
          Best for {REGION_LABELS[region]}
        </h2>

        {ranked.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            None of your current balances have a good option for this region.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ranked.map(({ balance, option }) => (
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

                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  {formatCents(option.totalValueCents)} —{" "}
                  {option.kind === "direct" ? "direct redemption" : `transfer to ${option.partnerProgramName}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {excluded.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50">
            No {REGION_LABELS[region]} options
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {excluded
              .map((b) => b.rewardsProgram.shortName ?? b.rewardsProgram.name)
              .join(", ")}{" "}
            {excluded.length === 1 ? "doesn't" : "don't"} have a good redemption for this region
            right now.
          </p>
        </section>
      )}
    </>
  );
}
