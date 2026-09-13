// Ranks credit card products by estimated value for a spending profile.
// Pure and DB-agnostic — callers map Prisma records into these input shapes.

import {
  SPEND_CATEGORIES,
  type EarnRates,
  type MonthlySpendCents,
  type SpendCategory,
} from "@/lib/spend-categories";

export type RewardsPreference = "ANY" | "TRAVEL" | "CASHBACK";

export type ScoringProfile = {
  monthlySpendCents: MonthlySpendCents;
  rewardsPreference: RewardsPreference;
  maxAnnualFeeCents: number | null;
};

export type ScoringProgramType = "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";

export type ScoringCard = {
  id: string;
  issuer: string;
  name: string;
  program: {
    id: string;
    name: string;
    shortName: string | null;
    type: ScoringProgramType;
    pointsUnit: string;
    defaultRedemptionValueCents: number;
  };
  annualFeeCents: number;
  welcomeBonusPoints: number | null;
  welcomeBonusSpendCents: number | null;
  welcomeBonusMonths: number | null;
  baseEarnRate: number;
  earnRates: EarnRates;
};

export type CardRecommendation = {
  card: ScoringCard;
  annualPoints: number;
  pointsByCategory: Record<SpendCategory, number>;
  earnValueCents: number;
  welcomeBonusValueCents: number;
  bonusEarned: boolean;
  firstYearValueCents: number;
  ongoingValueCents: number;
};

export type ScoreCardsResult = {
  ranked: CardRecommendation[];
  alreadyHeld: ScoringCard[];
  bestByCategory: Partial<Record<SpendCategory, CardRecommendation>>;
};

/** Case-insensitive key matching how wallet cards (issuer + productName) name themselves. */
export function cardKey(issuer: string, name: string): string {
  return `${issuer.trim()} ${name.trim()}`.toLowerCase();
}

export function effectiveRate(card: ScoringCard, category: SpendCategory): number {
  return card.earnRates[category] ?? card.baseEarnRate;
}

export function scoreCards({
  profile,
  cards,
  heldCardKeys,
}: {
  profile: ScoringProfile;
  cards: ScoringCard[];
  heldCardKeys: Set<string>;
}): ScoreCardsResult {
  const alreadyHeld: ScoringCard[] = [];
  const candidates: ScoringCard[] = [];

  for (const card of cards) {
    if (heldCardKeys.has(cardKey(card.issuer, card.name))) {
      alreadyHeld.push(card);
      continue;
    }
    if (profile.maxAnnualFeeCents !== null && card.annualFeeCents > profile.maxAnnualFeeCents) {
      continue;
    }
    if (!matchesPreference(card.program.type, profile.rewardsPreference)) {
      continue;
    }
    candidates.push(card);
  }

  const ranked = candidates
    .map((card) => scoreCard(card, profile))
    .sort((a, b) => b.firstYearValueCents - a.firstYearValueCents);

  const bestByCategory: Partial<Record<SpendCategory, CardRecommendation>> = {};
  for (const category of SPEND_CATEGORIES) {
    if (profile.monthlySpendCents[category] <= 0) continue;
    let best: CardRecommendation | null = null;
    for (const rec of ranked) {
      const value = effectiveRate(rec.card, category) * rec.card.program.defaultRedemptionValueCents;
      const bestValue = best
        ? effectiveRate(best.card, category) * best.card.program.defaultRedemptionValueCents
        : -1;
      if (value > bestValue) best = rec;
    }
    if (best) bestByCategory[category] = best;
  }

  return { ranked, alreadyHeld, bestByCategory };
}

function matchesPreference(type: ScoringProgramType, preference: RewardsPreference): boolean {
  if (preference === "ANY") return true;
  if (preference === "CASHBACK") return type === "CASHBACK";
  return type === "BANK_TRANSFERABLE" || type === "AIRLINE" || type === "HOTEL";
}

function scoreCard(card: ScoringCard, profile: ScoringProfile): CardRecommendation {
  const pointsByCategory = {} as Record<SpendCategory, number>;
  let annualPoints = 0;
  let monthlySpendCents = 0;

  for (const category of SPEND_CATEGORIES) {
    const monthly = profile.monthlySpendCents[category];
    monthlySpendCents += monthly;
    const points = (monthly / 100) * 12 * effectiveRate(card, category);
    pointsByCategory[category] = points;
    annualPoints += points;
  }

  const cpp = card.program.defaultRedemptionValueCents;
  const earnValueCents = annualPoints * cpp;

  const bonusEarned =
    card.welcomeBonusPoints !== null &&
    card.welcomeBonusSpendCents !== null &&
    card.welcomeBonusMonths !== null &&
    monthlySpendCents * card.welcomeBonusMonths >= card.welcomeBonusSpendCents;
  const welcomeBonusValueCents = bonusEarned ? (card.welcomeBonusPoints ?? 0) * cpp : 0;

  return {
    card,
    annualPoints,
    pointsByCategory,
    earnValueCents,
    welcomeBonusValueCents,
    bonusEarned,
    firstYearValueCents: earnValueCents + welcomeBonusValueCents - card.annualFeeCents,
    ongoingValueCents: earnValueCents - card.annualFeeCents,
  };
}
