import { findCatalogCards, findWalletHistory } from "@/lib/recommendations/get-card-recommendations";
import { indexCardEligibility } from "@/lib/cards/card-eligibility";
import { indexHeldCards, isHeldCard } from "@/lib/recommendations/score-cards";
import { resolveCardTransfers } from "@/lib/recommendations/card-point-value";
import { closeGapWithCards, type CardGapContribution } from "./close-gap-with-cards";
import type { GoalProgressResult } from "./get-goal-progress";

export type GapCardRow = {
  card: {
    id: string;
    issuer: string;
    name: string;
    annualFeeCents: number;
    firstYearFeeWaived: boolean;
    welcomeBonusPoints: number | null;
    welcomeBonusSpendCents: number | null;
    welcomeBonusMonths: number | null;
    program: { name: string; shortName: string | null; pointsUnit: string };
  };
  contribution: CardGapContribution;
};

export type GoalGapCardsResult = {
  /** Cards not in the wallet whose bonus the user can likely get and that moves the needle, best first. */
  ranked: GapCardRow[];
  byCardId: Map<string, CardGapContribution>;
};

export async function getGoalGapCards(
  userId: string,
  progress: GoalProgressResult
): Promise<GoalGapCardsResult> {
  const [cards, wallet] = await Promise.all([findCatalogCards(), findWalletHistory(userId)]);

  const held = indexHeldCards(wallet);
  const heldCardIds = new Set(cards.filter((card) => isHeldCard(card, held)).map((card) => card.id));
  // A bonus the issuer won't pay (or a card it would likely decline) can't close a gap.
  const eligibility = indexCardEligibility(cards, wallet, new Date());
  const candidates = cards.filter(
    (card) => !heldCardIds.has(card.id) && eligibility.get(card.id)?.status === "eligible"
  );

  const byCardId = closeGapWithCards({
    plans: progress.plans,
    cards: candidates.map((card) => ({
      id: card.id,
      programId: card.program.id,
      welcomeBonusPoints: card.welcomeBonusPoints,
      transferFactor: resolveCardTransfers(card, cards, heldCardIds).factor,
    })),
    transferRoutes: progress.transferRoutes,
  });

  const ranked: GapCardRow[] = candidates
    .flatMap((card) => {
      const contribution = byCardId.get(card.id);
      if (!contribution) return [];
      return [
        {
          card: {
            id: card.id,
            issuer: card.issuer,
            name: card.name,
            annualFeeCents: card.annualFeeCents,
            firstYearFeeWaived: card.firstYearFeeWaived,
            welcomeBonusPoints: card.welcomeBonusPoints,
            welcomeBonusSpendCents: card.welcomeBonusSpendCents,
            welcomeBonusMonths: card.welcomeBonusMonths,
            program: card.program,
          },
          contribution,
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.contribution.closesGap) - Number(a.contribution.closesGap) ||
        a.contribution.shortfallAfter - b.contribution.shortfallAfter ||
        a.card.annualFeeCents - b.card.annualFeeCents
    );

  return { ranked, byCardId };
}
