import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSessionUserId } from "@/lib/user";
import { calendarDateInputValue, formatCalendarDate, formatCents, programLabel } from "@/lib/format";
import { bonusProgress, nextAnnualFee, FEE_DUE_SOON_DAYS, type TimelineCard } from "@/lib/cards/card-timeline";
import {
  countFiveTwentyFour,
  countsToward524,
  fiveTwentyFourUntil,
  FIVE_TWENTY_FOUR_LIMIT,
  type FiveTwentyFour,
} from "@/lib/cards/card-eligibility";
import { AddCardForm } from "@/components/cards/add-card-form";
import { CardRowActions, type EditableCard } from "@/components/cards/card-row-actions";
import { BonusTracker } from "@/components/cards/bonus-tracker";
import { ProgramBadge } from "@/components/programs/program-badge";
import { WalletIcon } from "@/components/icons";
import { CardArt } from "@/components/recommendations/card-art";
import { riseInDelay, rowCardClass } from "@/components/ui/card";
import { PageHeader, pageContainerClass } from "@/components/ui/page-header";
import { quietLinkClass, sectionTitleClass } from "@/components/ui/text";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat, StatsStrip } from "@/components/ui/stats-strip";
import { Breakdown, BreakdownItem } from "@/components/ui/breakdown";

// Cards mutate via the API after build, so this page must be re-rendered per
// request rather than statically prerendered at build time.
export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const userId = await requireSessionUserId();

  const cards = await findCards(userId);

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

  const now = new Date();
  const openCards = cards.filter((card) => !card.closedOn);
  const closedCards = cards.filter((card) => card.closedOn);

  // A closed card can be opened again as a new account, so only open ones leave the picker.
  const heldProductIds = new Set(openCards.flatMap((c) => (c.cardProductId ? [c.cardProductId] : [])));
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
        Track which cards feed which program&apos;s pooled balance — and when fees, bonus deadlines and
        5/24 come round.
      </PageHeader>

      {cards.length > 0 && <WalletStats cards={cards} openCards={openCards} now={now} />}

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Add a card</h2>
        <AddCardForm programs={programs} catalog={pickableCatalog} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitleClass}>Your wallet</h2>

        {openCards.length === 0 ? (
          <EmptyState icon={WalletIcon}>No cards tracked yet.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {openCards.map((card, index) => (
              <WalletCardRow key={card.id} card={card} now={now} index={index} />
            ))}
          </ul>
        )}

        {closedCards.length > 0 && (
          <details className="group">
            <summary className={`cursor-pointer list-none [&::-webkit-details-marker]:hidden ${quietLinkClass}`}>
              <span className="group-open:hidden">
                Show {closedCards.length} closed {closedCards.length === 1 ? "card" : "cards"} &darr;
              </span>
              <span className="hidden group-open:inline">Hide closed cards &uarr;</span>
            </summary>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Kept because they still count toward 5/24 and issuers&apos; once-per-card bonus rules.
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {closedCards.map((card, index) => (
                <WalletCardRow key={card.id} card={card} now={now} index={index} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

function findCards(userId: string) {
  return prisma.creditCard.findMany({
    where: { userId },
    include: { rewardsProgram: true, cardProduct: { select: { firstYearFeeWaived: true } } },
    orderBy: [{ issuer: "asc" }, { productName: "asc" }],
  });
}

type WalletCard = Awaited<ReturnType<typeof findCards>>[number];

function toTimelineCard(card: WalletCard): TimelineCard {
  return { ...card, firstYearFeeWaived: card.cardProduct?.firstYearFeeWaived ?? false };
}

function WalletStats({ cards, openCards, now }: { cards: WalletCard[]; openCards: WalletCard[]; now: Date }) {
  const fiveTwentyFour = countFiveTwentyFour(cards, now);
  const feesDue = openCards.flatMap((card) => {
    const fee = nextAnnualFee(toTimelineCard(card), now);
    return fee?.dueSoon ? [fee] : [];
  });
  const bonusesOpen = openCards.filter((card) => {
    const kind = bonusProgress(toTimelineCard(card), now).kind;
    return kind === "in_progress" || kind === "spend_met";
  }).length;

  return (
    <section className="flex flex-col gap-2">
      <StatsStrip className="grid-cols-3 divide-x">
        <Stat label="Chase 5/24" tone={fiveTwentyFour.count >= FIVE_TWENTY_FOUR_LIMIT ? "warning" : "default"}>
          {fiveTwentyFour.count}/24
        </Stat>
        <Stat label={`Fees in ${FEE_DUE_SOON_DAYS} days`} tone={feesDue.length > 0 ? "warning" : "default"}>
          {formatCents(feesDue.reduce((sum, fee) => sum + fee.amountCents, 0))}
        </Stat>
        <Stat label="Bonuses in progress">{bonusesOpen}</Stat>
      </StatsStrip>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{fiveTwentyFourNote(fiveTwentyFour)}</p>
    </section>
  );
}

function fiveTwentyFourNote({ count, undated, nextDropOn, underLimitOn }: FiveTwentyFour): string {
  const parts = [
    count >= FIVE_TWENTY_FOUR_LIMIT
      ? `At ${count}, Chase usually declines new cards${underLimitOn ? ` until ${formatCalendarDate(underLimitOn)}` : ""}.`
      : `${FIVE_TWENTY_FOUR_LIMIT - count} more ${FIVE_TWENTY_FOUR_LIMIT - count === 1 ? "card" : "cards"} before Chase's 5/24 limit.`,
    nextDropOn && `The count next drops on ${formatCalendarDate(nextDropOn)}.`,
    undated > 0 &&
      `${undated} ${undated === 1 ? "card has" : "cards have"} no opened date and can't be counted — add ${undated === 1 ? "it" : "them"} with Edit.`,
  ];
  return parts.filter(Boolean).join(" ");
}

function WalletCardRow({ card, now, index }: { card: WalletCard; now: Date; index: number }) {
  const cardName = `${card.issuer} ${card.productName}`;
  const timeline = toTimelineCard(card);
  const fee = nextAnnualFee(timeline, now);
  const countsUntil = fiveTwentyFourUntil(card, now);
  const editable: EditableCard = {
    id: card.id,
    cardName,
    nickname: card.nickname,
    annualFeeCents: card.annualFeeCents,
    openedOn: card.openedOn ? calendarDateInputValue(card.openedOn) : null,
    isClosed: card.closedOn !== null,
    isBusiness: card.isBusiness,
    bonusPoints: card.bonusPoints,
    bonusSpendCents: card.bonusSpendCents,
    bonusMonths: card.bonusMonths,
    bonusSpentCents: card.bonusSpentCents,
    bonusReceivedOn: card.bonusReceivedOn ? calendarDateInputValue(card.bonusReceivedOn) : null,
  };

  return (
    <li className={`flex flex-col gap-3 ${rowCardClass}`} style={riseInDelay(index)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
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
              {cardName}
              {card.nickname && <span className="text-zinc-500 dark:text-zinc-400"> ({card.nickname})</span>}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Feeds{" "}
              <Link href={`/programs/${card.rewardsProgramId}`} className="underline-offset-2 hover:underline">
                {programLabel(card.rewardsProgram)}
              </Link>
              {card.isBusiness && " · business"}
              {card.openedOn && ` · opened ${formatCalendarDate(card.openedOn)}`}
            </p>
          </div>
        </div>

        <CardRowActions card={editable} />
      </div>

      <BonusTracker id={card.id} cardName={cardName} progress={bonusProgress(timeline, now)} pointsUnit={card.rewardsProgram.pointsUnit} />

      <Breakdown>
        {card.closedOn ? (
          <BreakdownItem label="Closed" valueClassName="text-zinc-700 dark:text-zinc-300">
            {formatCalendarDate(card.closedOn)}
          </BreakdownItem>
        ) : (
          <BreakdownItem
            label={fee?.isFirstFee ? "First fee" : "Annual fee"}
            valueClassName={
              fee?.dueSoon ? "font-medium text-amber-700 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"
            }
          >
            {annualFeeLabel(card, fee)}
          </BreakdownItem>
        )}
        <BreakdownItem label="5/24" valueClassName="text-zinc-700 dark:text-zinc-300">
          {countsUntil
            ? `counts until ${formatCalendarDate(countsUntil)}`
            : !countsToward524(card)
              ? "doesn't count"
              : card.openedOn
                ? "no longer counts"
                : "add the opened date"}
        </BreakdownItem>
      </Breakdown>
    </li>
  );
}

function annualFeeLabel(card: WalletCard, fee: ReturnType<typeof nextAnnualFee>): string {
  if (!card.annualFeeCents) return "none";
  if (!fee) return `${formatCents(card.annualFeeCents)} · add the opened date to see when`;
  const days = fee.dueSoon ? ` · in ${fee.daysUntil} ${fee.daysUntil === 1 ? "day" : "days"}` : "";
  return `${formatCents(fee.amountCents)} on ${formatCalendarDate(fee.dueOn)}${days}`;
}
