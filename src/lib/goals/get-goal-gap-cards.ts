import { findCatalogCards, findHeldCards } from "@/lib/recommendations/get-card-recommendations";
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
    welcomeBonusPoints: number | null;
    welcomeBonusSpendCents: number | null;
    welcomeBonusMonths: number | null;
    program: { name: string; shortName: string | null; pointsUnit: string };
  };
  contribution: CardGapContribution;
};

export type GoalGapCardsResult = {
  /** Cards not already in the wallet whose bonus moves the needle, best first. */
  ranked: GapCardRow[];
  byCardId: Map<string, CardGapContribution>;
};

export async function getGoalGapCards(
  userId: string,
  progress: GoalProgressResult
): Promise<GoalGapCardsResult> {
  const [cards, heldCards] = await Promise.all([findCatalogCards(), findHeldCards(userId)]);

  const held = indexHeldCards(heldCards);
  const heldCardIds = new Set(cards.filter((card) => isHeldCard(card, held)).map((card) => card.id));
  const candidates = cards.filter((card) => !heldCardIds.has(card.id));

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
