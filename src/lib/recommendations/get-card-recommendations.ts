import type { SpendingProfile } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PersonalRates } from "@/lib/redemptions/personal-rates";
import {
  SPEND_CATEGORIES,
  SPEND_CENTS_FIELD,
  type EarnRates,
  type MonthlySpendCents,
} from "@/lib/spend-categories";
import {
  indexHeldCards,
  scoreCards,
  type RewardsPreference,
  type ScoreCardsResult,
  type ScoringCard,
  type ScoringProfile,
} from "./score-cards";
import type { Ratio } from "./card-point-value";

export function toScoringProfile(profile: SpendingProfile): ScoringProfile {
  return {
    monthlySpendCents: Object.fromEntries(
      SPEND_CATEGORIES.map((category) => [category, profile[SPEND_CENTS_FIELD[category]]])
    ) as MonthlySpendCents,
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

const programFields = {
  id: true,
  name: true,
  shortName: true,
  type: true,
  pointsUnit: true,
  defaultRedemptionValueCents: true,
} as const;

/**
 * The active catalog with each card's transfer routes and terms. Routes are at
 * the program's own ratios with no promos folded in: a card is a multi-year
 * choice, and a promo lasts weeks.
 */
export async function findCatalogCards(): Promise<ScoringCard[]> {
  const cards = await prisma.cardProduct.findMany({
    where: { isActive: true },
    include: {
      rewardsProgram: {
        select: {
          ...programFields,
          transfersFrom: {
            where: { isActive: true, toProgram: { isActive: true } },
            include: { toProgram: { select: programFields } },
          },
        },
      },
    },
  });

  return cards.map((card) => {
    const { transfersFrom, ...program } = card.rewardsProgram;
    const routes = transfersFrom.map((partner) => ({
      toProgram: {
        ...partner.toProgram,
        defaultRedemptionValueCents: partner.toProgram.defaultRedemptionValueCents.toNumber(),
      },
      ratioFrom: partner.ratioFrom,
      ratioTo: partner.ratioTo,
      estimatedRedemptionValueCents: partner.estimatedRedemptionValueCents?.toNumber() ?? null,
    }));
    // The catalog keys overrides by program name (reference data has no ids); the scorer wants ids.
    const overridesByName = (card.transferRatioOverrides ?? {}) as Record<string, Ratio>;
    const transferRatioOverrides = Object.fromEntries(
      routes.flatMap((route) => {
        const ratio = overridesByName[route.toProgram.name];
        return ratio ? [[route.toProgram.id, ratio]] : [];
      })
    );

    return {
      id: card.id,
      issuer: card.issuer,
      name: card.name,
      program: { ...program, defaultRedemptionValueCents: program.defaultRedemptionValueCents.toNumber() },
      annualFeeCents: card.annualFeeCents,
      welcomeBonusPoints: card.welcomeBonusPoints,
      welcomeBonusSpendCents: card.welcomeBonusSpendCents,
      welcomeBonusMonths: card.welcomeBonusMonths,
      baseEarnRate: card.baseEarnRate.toNumber(),
      earnRates: (card.earnRates ?? {}) as EarnRates,
      soloTransferShare: card.soloTransferShare.toNumber(),
      transferRatioOverrides,
      routes,
    };
  });
}

export async function getCardRecommendations(
  userId: string,
  profile: SpendingProfile,
  personalRates: PersonalRates,
  /** Programs that price at least one open goal (`goalProgramIds`); null when there are none. */
  goalProgramIds: ReadonlySet<string> | null
): Promise<ScoreCardsResult> {
  const [cards, heldCards] = await Promise.all([findCatalogCards(), findHeldCards(userId)]);

  return scoreCards({
    profile: toScoringProfile(profile),
    cards,
    ...indexHeldCards(heldCards),
    personalRates,
    goalProgramIds,
  });
}
