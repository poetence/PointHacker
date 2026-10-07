import type { SpendingProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { EarnRates } from "@/lib/spend-categories";
import {
  indexHeldCards,
  scoreCards,
  type RewardsPreference,
  type ScoreCardsResult,
  type ScoringProfile,
} from "./score-cards";

export function toScoringProfile(profile: SpendingProfile): ScoringProfile {
  return {
    monthlySpendCents: {
      DINING: profile.diningCents,
      GROCERIES: profile.groceriesCents,
      TRAVEL: profile.travelCents,
      GAS: profile.gasCents,
      TRANSIT: profile.transitCents,
      ONLINE: profile.onlineCents,
      OTHER: profile.otherCents,
    },
    rewardsPreference: profile.rewardsPreference as RewardsPreference,
    maxAnnualFeeCents: profile.maxAnnualFeeCents,
  };
}

/** The wallet cards that `isHeldCard` matches catalog cards against. */
export function findHeldCards(userId: string) {
  return prisma.creditCard.findMany({
    where: { userId },
    select: { issuer: true, productName: true, cardProductId: true },
  });
}

export async function getCardRecommendations(
  userId: string,
  profile: SpendingProfile
): Promise<ScoreCardsResult> {
  const [cards, heldCards] = await Promise.all([
    prisma.cardProduct.findMany({
      where: { isActive: true },
      include: { rewardsProgram: true },
    }),
    findHeldCards(userId),
  ]);

  return scoreCards({
    profile: toScoringProfile(profile),
    cards: cards.map((card) => ({
      id: card.id,
      issuer: card.issuer,
      name: card.name,
      program: {
        id: card.rewardsProgram.id,
        name: card.rewardsProgram.name,
        shortName: card.rewardsProgram.shortName,
        type: card.rewardsProgram.type,
        pointsUnit: card.rewardsProgram.pointsUnit,
        defaultRedemptionValueCents: card.rewardsProgram.defaultRedemptionValueCents.toNumber(),
      },
      annualFeeCents: card.annualFeeCents,
      welcomeBonusPoints: card.welcomeBonusPoints,
      welcomeBonusSpendCents: card.welcomeBonusSpendCents,
      welcomeBonusMonths: card.welcomeBonusMonths,
      baseEarnRate: card.baseEarnRate.toNumber(),
      earnRates: (card.earnRates ?? {}) as EarnRates,
    })),
    ...indexHeldCards(heldCards),
  });
}
