// A wallet card's upcoming dates: the next annual fee and the welcome-bonus
// deadline. Pure and DB-agnostic, like `points-expiration.ts`.

export const FEE_DUE_SOON_DAYS = 60;
export const BONUS_ENDING_SOON_DAYS = 30;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type TimelineCard = {
  openedOn: Date | null;
  closedOn: Date | null;
  annualFeeCents: number | null;
  /** From the catalog card; false for custom cards. */
  firstYearFeeWaived: boolean;
  bonusPoints: number | null;
  bonusSpendCents: number | null;
  bonusMonths: number | null;
  bonusSpentCents: number | null;
  bonusReceivedOn: Date | null;
};

/**
 * `months` after `date` in UTC, clamped to the end of a shorter month — a card
 * opened Jan 31 has its bonus deadline on Feb 28, not Mar 3.
 */
export function addMonthsUTC(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const result = new Date(date.getTime());
  result.setUTCFullYear(year, month, Math.min(date.getUTCDate(), lastDay));
  return result;
}

function startOfUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Whole days from `from` to `to`, counted on calendar dates; negative when `to` is earlier. */
function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfUTCDay(to).getTime() - startOfUTCDay(from).getTime()) / ONE_DAY_MS);
}

export type AnnualFee = {
  dueOn: Date;
  amountCents: number;
  /** The first fee on a card whose first year was free. */
  isFirstFee: boolean;
  daysUntil: number;
  dueSoon: boolean;
};

/**
 * The next fee to post: issuers charge on each account anniversary (and at
 * opening, unless the first year is waived — either way the next one is an
 * anniversary). Null for a closed or no-fee card, or one with no opened date.
 */
export function nextAnnualFee(card: TimelineCard, now: Date): AnnualFee | null {
  if (card.closedOn || !card.openedOn || !card.annualFeeCents) return null;

  // Calendar dates are stored at UTC midnight, so a fee due today isn't past yet.
  const today = startOfUTCDay(now);
  let years = 1;
  let dueOn = addMonthsUTC(card.openedOn, 12);
  while (dueOn.getTime() < today.getTime()) {
    years += 1;
    dueOn = addMonthsUTC(card.openedOn, 12 * years);
  }

  const daysUntil = daysBetween(today, dueOn);
  return {
    dueOn,
    amountCents: card.annualFeeCents,
    isFirstFee: card.firstYearFeeWaived && years === 1,
    daysUntil,
    dueSoon: daysUntil <= FEE_DUE_SOON_DAYS,
  };
}

export type BonusProgress =
  | { kind: "none" }
  | { kind: "received"; receivedOn: Date; points: number }
  | {
      kind: "in_progress";
      points: number;
      spendCents: number;
      spentCents: number;
      remainingCents: number;
      /** Null when the card has no opened date to count from. */
      deadline: Date | null;
      daysLeft: number | null;
      endingSoon: boolean;
    }
  /** The spend is done; the points usually post a statement or two later. */
  | { kind: "spend_met"; points: number; deadline: Date | null }
  /** The window closed with no received date — the user should say whether it came. */
  | { kind: "deadline_passed"; points: number; deadline: Date };

/** Where the card's welcome bonus stands. A closed card's open bonus is moot, so it reads as none. */
export function bonusProgress(card: TimelineCard, now: Date): BonusProgress {
  const points = card.bonusPoints;
  if (points === null) return { kind: "none" };
  if (card.bonusReceivedOn) return { kind: "received", receivedOn: card.bonusReceivedOn, points };
  if (card.closedOn) return { kind: "none" };

  const spendCents = card.bonusSpendCents ?? 0;
  const spentCents = card.bonusSpentCents ?? 0;
  const deadline =
    card.openedOn && card.bonusMonths ? addMonthsUTC(card.openedOn, card.bonusMonths) : null;

  if (spentCents >= spendCents) return { kind: "spend_met", points, deadline };
  const daysLeft = deadline ? daysBetween(now, deadline) : null;
  if (deadline && daysLeft !== null && daysLeft < 0) {
    return { kind: "deadline_passed", points, deadline };
  }

  return {
    kind: "in_progress",
    points,
    spendCents,
    spentCents,
    remainingCents: spendCents - spentCents,
    deadline,
    daysLeft,
    endingSoon: daysLeft !== null && daysLeft <= BONUS_ENDING_SOON_DAYS,
  };
}
