import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { formatCents, programLabel } from "@/lib/format";
import { AddCardForm } from "@/components/cards/add-card-form";
import { CardRowActions } from "@/components/cards/card-row-actions";
import { ProgramBadge } from "@/components/programs/program-badge";
import { WalletIcon } from "@/components/icons";
import { CardArt } from "@/components/recommendations/card-art";
import { rowCardClass } from "@/components/ui/card";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { sectionTitleClass } from "@/components/ui/text";

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

  const [programs, catalog] = await Promise.all([
    prisma.rewardsProgram.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, shortName: true },
    }),
    prisma.cardProduct.findMany({
      where: { isActive: true },
      orderBy: [{ issuer: "asc" }, { name: "asc" }],
      include: { rewardsProgram: { select: { name: true, shortName: true } } },
    }),
  ]);

  const heldProductIds = new Set(cards.flatMap((c) => (c.cardProductId ? [c.cardProductId] : [])));
  const pickableCatalog = catalog
    .filter((c) => !heldProductIds.has(c.id))
    .map((c) => ({
      id: c.id,
      issuer: c.issuer,
      name: c.name,
      programLabel: programLabel(c.rewardsProgram),
      annualFeeCents: c.annualFeeCents,
    }));

  return (
    <div className={pageContainerClass}>
      <PageHeader icon={WalletIcon} tone="sky" title="Your cards">
        Track which cards feed which program&apos;s pooled balance.
      </PageHeader>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Add a card</h2>
        <AddCardForm programs={programs} catalog={pickableCatalog} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your wallet</h2>

        {cards.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 py-10 text-center dark:border-zinc-700">
            <WalletIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No cards tracked yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {cards.map((card) => (
              <li
                key={card.id}
                className={`flex flex-wrap items-center justify-between gap-4 ${rowCardClass}`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  {card.cardProductId ? (
                    <CardArt issuer={card.issuer} name={card.productName} />
                  ) : (
                    <ProgramBadge
                      name={card.rewardsProgram.name}
                      shortName={card.rewardsProgram.shortName}
                      type={card.rewardsProgram.type}
                      size="sm"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="break-words font-medium text-black dark:text-zinc-50">
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
                        {programLabel(card.rewardsProgram)}
                      </Link>
                      {card.openedOn &&
                        ` · opened ${card.openedOn.toLocaleDateString("en-US", { timeZone: "UTC" })}`}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {card.annualFeeCents ? formatCents(card.annualFeeCents) : "No annual fee"}
                  </p>
                </div>

                <CardRowActions
                  id={card.id}
                  cardName={`${card.issuer} ${card.productName}`}
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
