import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents } from "@/lib/format";
import { AddCardForm } from "@/components/cards/add-card-form";
import { CardRowActions } from "@/components/cards/card-row-actions";

// Cards mutate via the API after build, so this page must be re-rendered per
// request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const userId = await requireSessionUserId();

  const cards = await prisma.creditCard.findMany({
    where: { userId },
    include: { rewardsProgram: true },
    orderBy: [{ issuer: "asc" }, { productName: "asc" }],
  });

  const programs = await prisma.rewardsProgram.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, shortName: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Your cards
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Track which cards feed which program&apos;s pooled balance.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Add a card
        </h2>
        <AddCardForm programs={programs} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Your wallet
        </h2>

        {cards.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No cards tracked yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {cards.map((card) => (
              <li key={card.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {card.issuer} {card.productName}
                    {card.nickname && (
                      <span className="text-zinc-500 dark:text-zinc-400"> ({card.nickname})</span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Feeds{" "}
                    <Link
                      href={`/programs/${card.rewardsProgramId}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {card.rewardsProgram.shortName ?? card.rewardsProgram.name}
                    </Link>
                    {card.openedOn &&
                      ` · opened ${card.openedOn.toLocaleDateString("en-US", { timeZone: "UTC" })}`}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {card.annualFeeCents ? formatCents(card.annualFeeCents) : "No annual fee"}
                  </p>
                </div>

                <CardRowActions
                  id={card.id}
                  currentNickname={card.nickname}
                  currentAnnualFeeCents={card.annualFeeCents}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
