import { describe, expect, it } from "vitest";
import { addMonthsUTC, bonusProgress, nextAnnualFee, type TimelineCard } from "./card-timeline";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const NOW = new Date("2026-10-28T15:00:00Z");

function card(overrides: Partial<TimelineCard> = {}): TimelineCard {
  return {
    openedOn: day("2026-03-15"),
    closedOn: null,
    annualFeeCents: 9500,
    firstYearFeeWaived: false,
    bonusPoints: 60000,
    bonusSpendCents: 400000,
    bonusMonths: 3,
    bonusSpentCents: null,
    bonusReceivedOn: null,
    ...overrides,
  };
}

describe("addMonthsUTC", () => {
  it("clamps to the end of a shorter month", () => {
    expect(addMonthsUTC(day("2026-01-31"), 1)).toEqual(day("2026-02-28"));
    expect(addMonthsUTC(day("2028-02-29"), 12)).toEqual(day("2029-02-28"));
  });

  it("rolls into the next year", () => {
    expect(addMonthsUTC(day("2026-11-15"), 3)).toEqual(day("2027-02-15"));
  });
});

describe("nextAnnualFee", () => {
  it("is the next account anniversary", () => {
    const fee = nextAnnualFee(card(), NOW);
    expect(fee).toMatchObject({ dueOn: day("2027-03-15"), amountCents: 9500, isFirstFee: false });
    expect(fee?.dueSoon).toBe(false);
  });

  it("walks past anniversaries already gone", () => {
    expect(nextAnnualFee(card({ openedOn: day("2019-12-01") }), NOW)?.dueOn).toEqual(day("2026-12-01"));
  });

  it("counts a fee due today as due, not past", () => {
    const fee = nextAnnualFee(card({ openedOn: day("2025-10-28") }), NOW);
    expect(fee).toMatchObject({ dueOn: day("2026-10-28"), daysUntil: 0, dueSoon: true });
  });

  it("flags a fee inside the warning window", () => {
    const fee = nextAnnualFee(card({ openedOn: day("2025-12-10") }), NOW);
    expect(fee).toMatchObject({ daysUntil: 43, dueSoon: true });
  });

  it("marks the first fee on a card whose first year was free", () => {
    expect(nextAnnualFee(card({ firstYearFeeWaived: true }), NOW)?.isFirstFee).toBe(true);
    const later = nextAnnualFee(card({ firstYearFeeWaived: true, openedOn: day("2024-03-15") }), NOW);
    expect(later?.isFirstFee).toBe(false);
  });

  it("is null for closed, no-fee and undated cards", () => {
    expect(nextAnnualFee(card({ closedOn: day("2026-09-01") }), NOW)).toBeNull();
    expect(nextAnnualFee(card({ annualFeeCents: 0 }), NOW)).toBeNull();
    expect(nextAnnualFee(card({ annualFeeCents: null }), NOW)).toBeNull();
    expect(nextAnnualFee(card({ openedOn: null }), NOW)).toBeNull();
  });
});

describe("bonusProgress", () => {
  const opened = day("2026-09-10"); // deadline Dec 10, 43 days out

  it("tracks spend still needed and the deadline", () => {
    expect(bonusProgress(card({ openedOn: opened, bonusSpentCents: 150000 }), NOW)).toEqual({
      kind: "in_progress",
      points: 60000,
      spendCents: 400000,
      spentCents: 150000,
      remainingCents: 250000,
      deadline: day("2026-12-10"),
      daysLeft: 43,
      endingSoon: false,
    });
  });

  it("warns inside the last month", () => {
    const progress = bonusProgress(card({ openedOn: day("2026-08-15") }), NOW);
    expect(progress).toMatchObject({ kind: "in_progress", daysLeft: 18, endingSoon: true });
  });

  it("has no deadline without an opened date", () => {
    expect(bonusProgress(card({ openedOn: null }), NOW)).toMatchObject({
      kind: "in_progress",
      deadline: null,
      daysLeft: null,
      endingSoon: false,
    });
  });

  it("waits for the points once the spend is met", () => {
    expect(bonusProgress(card({ openedOn: opened, bonusSpentCents: 400000 }), NOW)).toEqual({
      kind: "spend_met",
      points: 60000,
      deadline: day("2026-12-10"),
    });
  });

  it("asks once the window has closed without a received date", () => {
    expect(bonusProgress(card({ openedOn: day("2026-03-15") }), NOW)).toEqual({
      kind: "deadline_passed",
      points: 60000,
      deadline: day("2026-06-15"),
    });
  });

  it("is done once received, even on a closed card", () => {
    const receivedOn = day("2026-07-01");
    expect(bonusProgress(card({ bonusReceivedOn: receivedOn, closedOn: day("2026-10-01") }), NOW)).toEqual({
      kind: "received",
      receivedOn,
      points: 60000,
    });
  });

  it("is none with no bonus, or an unfinished one on a closed card", () => {
    expect(bonusProgress(card({ bonusPoints: null }), NOW)).toEqual({ kind: "none" });
    expect(bonusProgress(card({ openedOn: opened, closedOn: day("2026-10-01") }), NOW)).toEqual({ kind: "none" });
  });
});
