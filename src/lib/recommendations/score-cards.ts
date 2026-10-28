// Ranks credit card products by estimated value for a spending profile.
// Pure and DB-agnostic — callers map Prisma records into these input shapes.

import type { ProgramType } from "@/lib/program-type";
import { ELIGIBLE, type CardEligibility } from "@/lib/cards/card-eligibility";
import type { PersonalRates } from "@/lib/redemptions/personal-rates";
import {
  SPEND_CATEGORIES,
  type EarnRates,
  type MonthlySpendCents,
  type SpendCategory,
} from "@/lib/spend-categories";
import {
  resolveCardTransfers,
  valueCardPoints,
  type CardPointValue,
  type PointRoute,
  type Ratio,
} from "./card-point-value";

export type RewardsPreference = "ANY" | "TRAVEL" | "CASHBACK";

export type ScoringProfile = {
  monthlySpendCents: MonthlySpendCents;
  rewardsPreference: RewardsPreference;
  maxAnnualFeeCents: number | null;
};

export type ScoringProgramType = ProgramType;

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
  /** The first year's fee is $0. */
  firstYearFeeWaived: boolean;
  welcomeBonusPoints: number | null;
  welcomeBonusSpendCents: number | null;
  welcomeBonusMonths: number | null;
  baseEarnRate: number;
  earnRates: EarnRates;
  /** Share of each route's ratio the card gets on its own; 0 = no transfers, 1 = full. */
  soloTransferShare: number;
  /** Keyed by destination program id. */
  transferRatioOverrides: Record<string, Ratio>;
  /** The program's transfer routes, at its own ratios. */
  routes: PointRoute[];
};

export type CardRecommendation = {
  card: ScoringCard;
  annualPoints: number;
  pointsByCategory: Record<SpendCategory, number>;
  earnValueCents: number;
  welcomeBonusValueCents: number;
  bonusEarned: boolean;
  /** Whether the user can get the card and its bonus; `no_bonus` scores the bonus at 0. */
  eligibility: Exclude<CardEligibility, { status: "likely_denied" }>;
  /** What one of the card's points is worth to this user, and the use that gets it. */
  pointValue: CardPointValue;
  firstYearValueCents: number;
  ongoingValueCents: number;
};

export type IneligibleCard = {
  card: ScoringCard;
  eligibility: Extract<CardEligibility, { status: "likely_denied" }>;
};

export type ScoreCardsResult = {
  ranked: CardRecommendation[];
  alreadyHeld: ScoringCard[];
  /** Cards that pass the profile's filters but the issuer would likely decline. */
  ineligible: IneligibleCard[];
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

/** Indexes wallet cards for `isHeldCard`; a closed card isn't held. */
export function indexHeldCards(
  walletCards: { issuer: string; productName: string; cardProductId: string | null; closedOn?: Date | null }[]
): HeldCardIndex {
  const heldCards = walletCards.filter((card) => !card.closedOn);
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
  personalRates,
  goalProgramIds,
  eligibility,
}: {
  profile: ScoringProfile;
  cards: ScoringCard[];
  heldCardKeys: Set<string>;
  heldCardProductIds?: Set<string>;
  /** Required so no caller silently scores on estimates; pass `NO_PERSONAL_RATES` to opt out. */
  personalRates: PersonalRates;
  /** Programs that price at least one open goal; null when the user has none. */
  goalProgramIds: ReadonlySet<string> | null;
  /**
   * Keyed by card id (`indexCardEligibility`); a missing card is eligible.
   * Required so no caller silently ignores the wallet's history; pass
   * `NO_ELIGIBILITY_CHECKS` to opt out.
   */
  eligibility: ReadonlyMap<string, CardEligibility>;
}): ScoreCardsResult {
  const alreadyHeld: ScoringCard[] = [];
  const ineligible: IneligibleCard[] = [];
  const candidates: { card: ScoringCard; eligibility: CardRecommendation["eligibility"] }[] = [];

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
    const cardEligibility = eligibility.get(card.id) ?? ELIGIBLE;
    if (cardEligibility.status === "likely_denied") {
      ineligible.push({ card, eligibility: cardEligibility });
      continue;
    }
    candidates.push({ card, eligibility: cardEligibility });
  }

  const heldCardIds = new Set(alreadyHeld.map((card) => card.id));
  const ranked = candidates
    .map(({ card, eligibility: cardEligibility }) => {
      const pointValue = valueCardPoints({
        program: card.program,
        routes: card.routes,
        transfers: resolveCardTransfers(card, cards, heldCardIds),
        personalRates,
        goalProgramIds,
      });
      return scoreCard(card, profile, pointValue, cardEligibility);
    })
    .sort((a, b) => b.firstYearValueCents - a.firstYearValueCents);

  const bestByCategory: Partial<Record<SpendCategory, CardRecommendation>> = {};
  for (const category of SPEND_CATEGORIES) {
    if (profile.monthlySpendCents[category] <= 0) continue;
    const best = bestCardForCategory(ranked, category);
    if (best) bestByCategory[category] = best;
  }

  return { ranked, alreadyHeld, ineligible, bestByCategory };
}

/** The card worth the most per dollar in one category; ties go to the higher-ranked card. */
function bestCardForCategory(
  ranked: CardRecommendation[],
  category: SpendCategory
): CardRecommendation | null {
  const centsPerDollar = (rec: CardRecommendation) =>
    effectiveRate(rec.card, category) * rec.pointValue.centsPerPoint;

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

function scoreCard(
  card: ScoringCard,
  profile: ScoringProfile,
  pointValue: CardPointValue,
  eligibility: CardRecommendation["eligibility"]
): CardRecommendation {
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

  const cpp = pointValue.centsPerPoint;
  const earnValueCents = annualPoints * cpp;

  const bonusEarned =
    eligibility.status === "eligible" &&
    card.welcomeBonusPoints !== null &&
    card.welcomeBonusSpendCents !== null &&
    card.welcomeBonusMonths !== null &&
    monthlySpendCents * card.welcomeBonusMonths >= card.welcomeBonusSpendCents;
  const welcomeBonusValueCents = bonusEarned ? (card.welcomeBonusPoints ?? 0) * cpp : 0;
  const firstYearFeeCents = card.firstYearFeeWaived ? 0 : card.annualFeeCents;

  return {
    card,
    annualPoints,
    pointsByCategory,
    earnValueCents,
    welcomeBonusValueCents,
    bonusEarned,
    eligibility,
    pointValue,
    firstYearValueCents: earnValueCents + welcomeBonusValueCents - firstYearFeeCents,
    ongoingValueCents: earnValueCents - card.annualFeeCents,
  };
}
