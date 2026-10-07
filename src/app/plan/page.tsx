import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { getRegionRedemptionOptions } from "@/lib/redemptions/get-region-redemption-options";
import { formatCents, programLabel } from "@/lib/format";
import { ALL_REGIONS, REGION_LABELS, isRegion } from "@/lib/regions";
import type { RedemptionOption } from "@/lib/redemptions/compute-best-redemptions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { ExpirationPill } from "@/components/balances/expiration-pill";
import { CompassIcon } from "@/components/icons";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { rowCardClass } from "@/components/ui/card";
import { RegionScene } from "@/components/regions/region-scene";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";

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
    <div className={pageContainerClass}>
      <PageHeader icon={CompassIcon} tone="violet" title="Plan a trip">
        Pick a region to see which of your balances are actually worth using there.
      </PageHeader>

      <form method="GET" className="flex flex-wrap items-end gap-3">
        <Field label="Region" className="w-56">
          <Select name="region" defaultValue={region ?? ""}>
            <option value="" disabled>
              Choose a region
            </option>
            {ALL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit">Show options</Button>
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
      <section className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800">
          <RegionScene region={region} className="h-24" />
          <h2 className="bg-white px-5 py-3 font-display text-xl font-semibold tracking-tight text-black dark:bg-zinc-900/50 dark:text-zinc-50">
            Best for {REGION_LABELS[region]}
          </h2>
        </div>

        {ranked.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            None of your current balances have a good option for this region.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {ranked.map(({ balance, option }) => (
              <li
                key={balance.id}
                className={`flex flex-wrap items-center justify-between gap-4 ${rowCardClass}`}
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
                      {programLabel(balance.rewardsProgram)}
                    </Link>
                    <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {balance.balance.toLocaleString("en-US")} {balance.rewardsProgram.pointsUnit}
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
                  {option.kind === "direct"
                    ? "direct redemption"
                    : `transfer to ${option.partnerProgramName}${option.activeBonusPercent ? ` (+${option.activeBonusPercent}% bonus)` : ""}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {excluded.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className={sectionTitleClass}>
            No {REGION_LABELS[region]} options
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {excluded
              .map((b) => programLabel(b.rewardsProgram))
              .join(", ")}{" "}
            {excluded.length === 1 ? "doesn't" : "don't"} have a good redemption for this region
            right now.
          </p>
        </section>
      )}
    </>
  );
}
