import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents } from "@/lib/format";
import { SPEND_CATEGORIES, SPEND_CATEGORY_LABELS } from "@/lib/spend-categories";
import {
  getCardRecommendations,
  toScoringProfile,
} from "@/lib/recommendations/get-card-recommendations";
import { effectiveRate } from "@/lib/recommendations/score-cards";
import { SpendingProfileForm } from "@/components/recommendations/spending-profile-form";
import { CardArt } from "@/components/recommendations/card-art";
import { CashIcon } from "@/components/icons";

// No dynamic route segment here, so Next would otherwise try to statically
// prerender this at build time — which has no DATABASE_URL in CI.
export const dynamic = "force-dynamic";

const sectionTitle =
  "font-display text-lg font-semibold tracking-tight text-black dark:text-zinc-50";

export default async function RecommendPage() {
  const userId = await requireSessionUserId();

  const profile = await prisma.spendingProfile.findUnique({ where: { userId } });
  const result = profile ? await getCardRecommendations(userId, profile) : null;
  const top = result?.ranked.slice(0, 8) ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 shadow-sm dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-300">
          <CashIcon className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Which card next?
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Cards ranked by estimated first-year value for how you actually spend.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className={sectionTitle}>Your spending</h2>
        <SpendingProfileForm initial={profile ? toScoringProfile(profile) : null} />
      </section>

      {!result && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
          <CashIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Fill in your monthly spending above to see which cards earn you the most.
          </p>
        </div>
      )}

      {result && (
        <>
          <section className="flex flex-col gap-4">
            <h2 className={sectionTitle}>Top cards for you</h2>

            {top.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No cards match your preferences — try raising the fee cap or widening the rewards
                type.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {top.map((rec, index) => (
                  <li
                    key={rec.card.id}
                    className={`flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 ${
                      index === 0 ? "ring-1 ring-emerald-300 dark:ring-emerald-800" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <CardArt issuer={rec.card.issuer} name={rec.card.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-black dark:text-zinc-50">
                          #{index + 1} {rec.card.issuer} {rec.card.name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {Math.round(rec.annualPoints).toLocaleString()}{" "}
                          {rec.card.program.shortName ?? rec.card.program.name}{" "}
                          {rec.card.program.pointsUnit}/yr
                        </p>
                      </div>
                      <div className="w-full sm:w-auto sm:text-right">
                        <p className="font-display text-xl font-semibold text-black dark:text-zinc-50">
                          {formatCents(rec.firstYearValueCents)}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          net first year &middot; {formatCents(rec.ongoingValueCents)}/yr after
                        </p>
                      </div>
                    </div>

                    <dl className="flex flex-wrap gap-x-5 gap-y-1 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
                      <div className="flex gap-1.5">
                        <dt className="text-zinc-500 dark:text-zinc-400">Earns</dt>
                        <dd className="font-medium text-emerald-600 dark:text-emerald-400">
                          +{formatCents(rec.earnValueCents)}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-zinc-500 dark:text-zinc-400">Welcome bonus</dt>
                        <dd
                          className={
                            rec.bonusEarned
                              ? "font-medium text-emerald-600 dark:text-emerald-400"
                              : "text-zinc-400 dark:text-zinc-500"
                          }
                        >
                          {rec.card.welcomeBonusPoints === null
                            ? "none"
                            : rec.bonusEarned
                              ? `+${formatCents(rec.welcomeBonusValueCents)}`
                              : `needs ${formatCents(rec.card.welcomeBonusSpendCents ?? 0)} in ${rec.card.welcomeBonusMonths} mo`}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt className="text-zinc-500 dark:text-zinc-400">Annual fee</dt>
                        <dd
                          className={
                            rec.card.annualFeeCents > 0
                              ? "font-medium text-red-600 dark:text-red-400"
                              : "text-zinc-400 dark:text-zinc-500"
                          }
                        >
                          {rec.card.annualFeeCents > 0 ? `−${formatCents(rec.card.annualFeeCents)}` : "none"}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {Object.keys(result.bestByCategory).length > 0 && (
            <section className="flex flex-col gap-4">
              <h2 className={sectionTitle}>Best card by category</h2>
              <ul className="flex flex-wrap gap-2">
                {SPEND_CATEGORIES.map((category) => {
                  const best = result.bestByCategory[category];
                  if (!best) return null;
                  return (
                    <li
                      key={category}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                    >
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {SPEND_CATEGORY_LABELS[category]}:
                      </span>{" "}
                      <span className="font-medium text-black dark:text-zinc-50">
                        {best.card.issuer} {best.card.name}
                      </span>{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">
                        ({effectiveRate(best.card, category)}x)
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {result.alreadyHeld.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className={sectionTitle}>Already in your wallet</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {result.alreadyHeld.map((c) => `${c.issuer} ${c.name}`).join(", ")} — skipped
                since you already hold {result.alreadyHeld.length === 1 ? "it" : "them"}.
              </p>
            </section>
          )}

          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Estimates only: earn rates, fees, and bonuses are snapshots of public offers and change
            often. Statement credits, lounge access, and category caps aren&apos;t modeled. Verify
            with the issuer before applying.
          </p>
        </>
      )}
    </div>
  );
}
