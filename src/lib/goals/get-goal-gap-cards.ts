import { prisma } from "@/lib/prisma";
import { findHeldCards } from "@/lib/recommendations/get-card-recommendations";
import { indexHeldCards, isHeldCard } from "@/lib/recommendations/score-cards";
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
  const [cards, heldCards] = await Promise.all([
    prisma.cardProduct.findMany({
      where: { isActive: true },
      include: { rewardsProgram: { select: { name: true, shortName: true, pointsUnit: true } } },
    }),
    findHeldCards(userId),
  ]);

  const held = indexHeldCards(heldCards);
  const candidates = cards.filter((card) => !isHeldCard(card, held));

  const byCardId = closeGapWithCards({
    plans: progress.plans,
    cards: candidates.map((card) => ({
      id: card.id,
      programId: card.rewardsProgramId,
      welcomeBonusPoints: card.welcomeBonusPoints,
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
            program: card.rewardsProgram,
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
