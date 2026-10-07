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

export type HeldCardIndex = {
  heldCardKeys: Set<string>;
  heldCardProductIds: Set<string>;
};

/** Indexes wallet cards for `isHeldCard`. */
export function indexHeldCards(
  heldCards: { issuer: string; productName: string; cardProductId: string | null }[]
): HeldCardIndex {
  return {
    heldCardKeys: new Set(heldCards.map((c) => cardKey(c.issuer, c.productName))),
    heldCardProductIds: new Set(heldCards.flatMap((c) => (c.cardProductId ? [c.cardProductId] : []))),
  };
}

/**
 * Whether a catalog card is already in the wallet: by catalog id when the
 * wallet card was picked from the catalog, else by issuer + name for cards
 * typed in by hand.
 */
export function isHeldCard(
  card: { id: string; issuer: string; name: string },
  { heldCardKeys, heldCardProductIds }: HeldCardIndex
): boolean {
  return heldCardProductIds.has(card.id) || heldCardKeys.has(cardKey(card.issuer, card.name));
}

export function effectiveRate(card: ScoringCard, category: SpendCategory): number {
  return card.earnRates[category] ?? card.baseEarnRate;
}

export function scoreCards({
  profile,
  cards,
  heldCardKeys,
  heldCardProductIds = new Set(),
}: {
  profile: ScoringProfile;
  cards: ScoringCard[];
  heldCardKeys: Set<string>;
  heldCardProductIds?: Set<string>;
}): ScoreCardsResult {
  const alreadyHeld: ScoringCard[] = [];
  const candidates: ScoringCard[] = [];

  for (const card of cards) {
    if (isHeldCard(card, { heldCardKeys, heldCardProductIds })) {
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
    const best = bestCardForCategory(ranked, category);
    if (best) bestByCategory[category] = best;
  }

  return { ranked, alreadyHeld, bestByCategory };
}

/** The card worth the most per dollar in one category; ties go to the higher-ranked card. */
function bestCardForCategory(
  ranked: CardRecommendation[],
  category: SpendCategory
): CardRecommendation | null {
  const centsPerDollar = (rec: CardRecommendation) =>
    effectiveRate(rec.card, category) * rec.card.program.defaultRedemptionValueCents;

  let best: CardRecommendation | null = null;
  for (const rec of ranked) {
    if (centsPerDollar(rec) > (best ? centsPerDollar(best) : -1)) best = rec;
  }
  return best;
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
