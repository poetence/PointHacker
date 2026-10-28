// Whether a catalog card is worth applying for given the wallet's history:
// Chase's 5/24 and each issuer's welcome-bonus rules (`issuer-rules.ts`).
// Pure and DB-agnostic — the recommender and the goal gap-closer feed it the
// whole wallet, closed cards included, since those still count.

import { cardKey } from "@/lib/recommendations/score-cards";
import {
  BUSINESS_CARDS_COUNT_TOWARD_524,
  ISSUER_RULES,
  type BonusRule,
  type IssuerRules,
  type ProductRef,
} from "@/lib/data/issuer-rules";
import { addMonthsUTC } from "./card-timeline";

export const FIVE_TWENTY_FOUR_LIMIT = 5;
const FIVE_TWENTY_FOUR_MONTHS = 24;

export type WalletHistoryCard = {
  issuer: string;
  productName: string;
  openedOn: Date | null;
  closedOn: Date | null;
  isBusiness: boolean;
  bonusPoints: number | null;
  bonusMonths: number | null;
  bonusReceivedOn: Date | null;
};

export type FiveTwentyFour = {
  /** Cards opened in the last 24 months that count. */
  count: number;
  /** Cards that would count but have no opened date, so they can't be placed. */
  undated: number;
  /** When the count next goes down; null when nothing counts. */
  nextDropOn: Date | null;
  /** At or over the limit: when it falls back under. */
  underLimitOn: Date | null;
};

function countsToward524(card: WalletHistoryCard): boolean {
  return !card.isBusiness || BUSINESS_CARDS_COUNT_TOWARD_524.includes(card.issuer);
}

/** Chase's count: personal cards (closed ones too) opened in the last 24 months. */
export function countFiveTwentyFour(cards: WalletHistoryCard[], now: Date): FiveTwentyFour {
  const counting = cards.filter(countsToward524);
  const dropDates = counting
    .flatMap((card) => (card.openedOn ? [addMonthsUTC(card.openedOn, FIVE_TWENTY_FOUR_MONTHS)] : []))
    .filter((dropOn) => dropOn.getTime() > now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  const count = dropDates.length;
  return {
    count,
    undated: counting.filter((card) => !card.openedOn).length,
    nextDropOn: dropDates[0] ?? null,
    underLimitOn: count >= FIVE_TWENTY_FOUR_LIMIT ? dropDates[count - FIVE_TWENTY_FOUR_LIMIT] : null,
  };
}

export type CardEligibility =
  | {
      status: "eligible";
      /** Undated cards might already put the user at 5/24. */
      undatedMayBlock: boolean;
    }
  | {
      status: "no_bonus";
      rule: BonusRule;
      /** The wallet card that triggers the rule. */
      blockedBy: ProductRef;
      /** When the bonus is available again; null = not again, or unknown when `undated`. */
      until: Date | null;
      /** The blocking card has no opened date, so the window can't be placed. */
      undated: boolean;
      verified: boolean;
    }
  | { status: "likely_denied"; rule: "five_twenty_four"; count: number; until: Date | null };

export const ELIGIBLE: CardEligibility = { status: "eligible", undatedMayBlock: false };

function issuerRules(issuer: string): IssuerRules | null {
  const key = issuer.trim().toLowerCase();
  const match = Object.entries(ISSUER_RULES).find(([name]) => name.toLowerCase() === key);
  return match?.[1] ?? null;
}

type Block = {
  /** When the bonus is available again; null = not again, or unknown when `undated`. */
  until: Date | null;
  /** The wallet card has no opened date, so the window can't be placed. */
  undated: boolean;
};

const NEVER: Block = { until: null, undated: false };
const UNDATED: Block = { until: null, undated: true };

/** How long `rule` blocks the bonus because of `card`, or null when it doesn't. */
function blockFor(rule: BonusRule, card: WalletHistoryCard, now: Date): Block | null {
  const until = (start: Date, months: number): Block | null => {
    const date = addMonthsUTC(start, months);
    return date.getTime() > now.getTime() ? { until: date, undated: false } : null;
  };

  switch (rule.kind) {
    case "ever_held":
      return NEVER;
    case "bonus_within": {
      // A card opened under an offer usually earned it, so with no received
      // date its bonus is assumed paid at the end of the spend window.
      if (!card.bonusReceivedOn && card.bonusPoints === null) return null;
      if (rule.months === null) return NEVER;
      if (card.bonusReceivedOn) return until(card.bonusReceivedOn, rule.months);
      if (!card.openedOn) return UNDATED;
      return until(card.openedOn, (card.bonusMonths ?? 0) + rule.months);
    }
    case "opened_within":
      return card.openedOn ? until(card.openedOn, rule.months) : UNDATED;
  }
}

/** Whether `a` blocks for longer than `b`: "not again" outlasts any date. */
function outlasts(a: Block, b: Block): boolean {
  if (b.until === null && !b.undated) return false;
  if (a.until === null) return true;
  return b.until !== null && a.until.getTime() > b.until.getTime();
}

/** Approval first (5/24), then the bonus rule against every card in the product's family. */
export function checkCardEligibility(
  card: { issuer: string; name: string },
  history: WalletHistoryCard[],
  fiveTwentyFour: FiveTwentyFour,
  now: Date
): CardEligibility {
  const rules = issuerRules(card.issuer);
  if (!rules) return ELIGIBLE;

  if (rules.fiveTwentyFour && fiveTwentyFour.count >= FIVE_TWENTY_FOUR_LIMIT) {
    return {
      status: "likely_denied",
      rule: "five_twenty_four",
      count: fiveTwentyFour.count,
      until: fiveTwentyFour.underLimitOn,
    };
  }

  const cardRule = rules.cards?.[card.name];
  const rule = cardRule?.bonus ?? rules.bonus;
  if (rule) {
    const family = [{ issuer: card.issuer, name: card.name }, ...(cardRule?.family ?? [])];
    const familyKeys = new Set(family.map((product) => cardKey(product.issuer, product.name)));

    let blocking: { card: WalletHistoryCard; block: Block } | null = null;
    for (const held of history) {
      if (!familyKeys.has(cardKey(held.issuer, held.productName))) continue;
      const block = blockFor(rule, held, now);
      if (block && (!blocking || outlasts(block, blocking.block))) blocking = { card: held, block };
    }

    if (blocking) {
      return {
        status: "no_bonus",
        rule,
        blockedBy: { issuer: blocking.card.issuer, name: blocking.card.productName },
        ...blocking.block,
        verified: (cardRule ?? rules).verified !== false,
      };
    }
  }

  const undatedMayBlock =
    rules.fiveTwentyFour === true &&
    fiveTwentyFour.count + fiveTwentyFour.undated >= FIVE_TWENTY_FOUR_LIMIT;
  return undatedMayBlock ? { status: "eligible", undatedMayBlock } : ELIGIBLE;
}

/** Every catalog card's eligibility, keyed by card id, for the recommender and gap-closer. */
export function indexCardEligibility(
  cards: { id: string; issuer: string; name: string }[],
  history: WalletHistoryCard[],
  now: Date
): Map<string, CardEligibility> {
  const fiveTwentyFour = countFiveTwentyFour(history, now);
  return new Map(cards.map((card) => [card.id, checkCardEligibility(card, history, fiveTwentyFour, now)]));
}
