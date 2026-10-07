import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents, programLabel } from "@/lib/format";
import { REGION_LABELS } from "@/lib/regions";
import { describeGoal, describeGoalUnit } from "@/lib/goals/cabins";
import { toGoalFormValues } from "@/lib/goals/goal-form-values";
import { getGoalProgress, goalOriginZone } from "@/lib/goals/get-goal-progress";
import { ORIGIN_ZONE_LABELS, originMultiplier } from "@/lib/goals/origin-adjustment";
import { getGoalGapCards } from "@/lib/goals/get-goal-gap-cards";
import { GoalActions } from "@/components/goals/goal-actions";
import { GoalProgressBar } from "@/components/goals/goal-progress-bar";
import { GapCardPill } from "@/components/goals/gap-card-pill";
import { ProgramBadge } from "@/components/programs/program-badge";
import { CardArt } from "@/components/recommendations/card-art";
import { RegionScene } from "@/components/regions/region-scene";
import { TargetIcon } from "@/components/icons";
import { rowCardClass } from "@/components/ui/card";
import { pageContainerClass } from "@/components/ui/page-header";
import { pageTitleClass, sectionTitleClass } from "@/components/ui/text";


export default async function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireSessionUserId();

  const goal = await prisma.awardGoal.findFirst({ where: { id, userId } });
  if (!goal) {
    notFound();
  }

  const progress = await getGoalProgress(userId, goal);
  const { plans } = progress;
  const best = plans[0] ?? null;

  const programTypeById = new Map(
    (
      await prisma.rewardsProgram.findMany({
        where: { id: { in: plans.map((p) => p.program.id) } },
        select: { id: true, type: true },
      })
    ).map((p) => [p.id, p.type])
  );

  const gapCards = best && !best.isReachable ? await getGoalGapCards(userId, progress) : null;

  const originZone = goalOriginZone(goal);
  const originPct = originZone ? Math.round((originMultiplier(goal.region, originZone) - 1) * 100) : 0;

  return (
    <div className={pageContainerClass}>
      <div>
        <Link href="/goals" className="text-sm text-zinc-500 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          &larr; All goals
        </Link>
      </div>

      <header className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800">
        <RegionScene region={goal.region} className="h-36" />
        <div className="bg-white px-5 py-4 dark:bg-zinc-900/50">
          <h1 className={`break-words ${pageTitleClass}`}>
            {goal.label}
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {REGION_LABELS[goal.region]} · {describeGoal(goal)}
          </p>
        </div>
      </header>

      <GoalActions goalId={goal.id} initial={toGoalFormValues(goal)} />

      {best ? (
        <div
          className={`rounded-xl border p-4 ${
            best.isReachable
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40"
              : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50"
          }`}
        >
          <p className="font-display text-xl font-semibold text-black dark:text-zinc-50">
            {best.isReachable
              ? `You can book this today via ${programLabel(best.program)}.`
              : `Closest route: ${programLabel(best.program)}, ${best.shortfall.toLocaleString("en-US")} ${best.program.pointsUnit} short.`}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {best.pointsNeeded.toLocaleString("en-US")} {best.program.pointsUnit} for{" "}
            {describeGoalUnit(goal)} · you hold {best.heldPoints.toLocaleString("en-US")}{" "}
            there and can transfer in{" "}
            {(best.potentialPoints - best.heldPoints).toLocaleString("en-US")} more.
            {originZone && originPct !== 0 && (
              <>
                {" "}
                Prices {originPct < 0 ? "trimmed" : "bumped"} {Math.abs(originPct)}% for a{" "}
                {ORIGIN_ZONE_LABELS[originZone]} departure.
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
          <TargetIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No program in the catalog prices {describeGoalUnit(goal)} in{" "}
            {REGION_LABELS[goal.region]} yet — try another{" "}
            {goal.kind === "FLIGHT" ? "cabin" : "tier"}.
          </p>
        </div>
      )}

      {plans.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={sectionTitleClass}>Ways to book it</h2>
          <ul className="flex flex-col gap-3">
            {plans.map((plan, index) => (
              <li
                key={plan.program.id}
                className={`flex flex-col gap-3 ${rowCardClass} ${
                  index === 0 && plan.isReachable ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProgramBadge
                      name={plan.program.name}
                      shortName={plan.program.shortName}
                      type={programTypeById.get(plan.program.id) ?? (goal.kind === "HOTEL" ? "HOTEL" : "AIRLINE")}
                      size="sm"
                    />
                    <div>
                      <Link
                        href={`/programs/${plan.program.id}`}
                        className="font-medium text-black underline-offset-2 hover:underline dark:text-zinc-50"
                      >
                        {programLabel(plan.program)}
                      </Link>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {plan.pointsNeeded.toLocaleString("en-US")} {plan.program.pointsUnit} needed
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-sm font-medium ${
                      plan.isReachable
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {plan.isReachable
                      ? "Bookable now"
                      : `${Math.round((plan.pointsCovered / plan.pointsNeeded) * 100)}% there`}
                  </p>
                </div>

                <GoalProgressBar
                  heldPoints={plan.heldPoints}
                  pointsCovered={plan.pointsCovered}
                  pointsNeeded={plan.pointsNeeded}
                  label={`Progress via ${programLabel(plan.program)}`}
                />

                <dl className="flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                  <div className="flex gap-1.5">
                    <dt className="text-zinc-500 dark:text-zinc-400">Held</dt>
                    <dd
                      className={
                        plan.heldPoints > 0
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {plan.heldPoints.toLocaleString("en-US")}
                    </dd>
                  </div>
                  {plan.transfers.map((step) => (
                    <div key={step.fromProgramId} className="flex gap-1.5">
                      <dt className="text-zinc-500 dark:text-zinc-400">Transfer</dt>
                      <dd className="font-medium text-sky-600 dark:text-sky-400">
                        {step.pointsToTransfer.toLocaleString("en-US")} {step.fromProgramName} →{" "}
                        {step.pointsReceived.toLocaleString("en-US")}
                        {step.activeBonusPercent ? ` (+${step.activeBonusPercent}% bonus)` : ""}
                      </dd>
                    </div>
                  ))}
                  <div className="flex gap-1.5">
                    <dt className="text-zinc-500 dark:text-zinc-400">Short by</dt>
                    <dd
                      className={
                        plan.shortfall > 0
                          ? "font-medium text-red-600 dark:text-red-400"
                          : "text-zinc-400 dark:text-zinc-500"
                      }
                    >
                      {plan.shortfall > 0 ? plan.shortfall.toLocaleString("en-US") : "nothing"}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </section>
      )}

      {gapCards && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={sectionTitleClass}>Close the gap with a card</h2>
            <Link
              href={`/recommend?goal=${goal.id}`}
              className="text-sm text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
            >
              Full recommendations &rarr;
            </Link>
          </div>

          {gapCards.ranked.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No catalog card&apos;s welcome bonus lands in a program that prices this trip.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {gapCards.ranked.slice(0, 3).map(({ card, contribution }) => (
                <li
                  key={card.id}
                  className={`flex flex-wrap items-center gap-4 ${rowCardClass}`}
                >
                  <CardArt issuer={card.issuer} name={card.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-black dark:text-zinc-50">
                      {card.issuer} {card.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {card.welcomeBonusPoints?.toLocaleString("en-US")} {programLabel(card.program)}{" "}
                      {card.program.pointsUnit} after {formatCents(card.welcomeBonusSpendCents ?? 0)} in{" "}
                      {card.welcomeBonusMonths} mo ·{" "}
                      {card.annualFeeCents > 0 ? `${formatCents(card.annualFeeCents)} fee` : "no fee"}
                    </p>
                  </div>
                  <GapCardPill contribution={contribution} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        {goal.kind === "FLIGHT"
          ? "Flight award prices are rough saver-level estimates from North America"
          : "Hotel award prices are rough standard-room estimates per tier"}{" "}
        and change constantly; availability, peak dates, and free-night perks aren&apos;t modeled. Verify with the program before moving points — transfers
        are one-way.
      </p>
    </div>
  );
}
