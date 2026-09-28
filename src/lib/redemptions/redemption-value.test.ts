import { describe, expect, it } from "vitest";
import {
  compareToBaseline,
  netValueCents,
  realizedCentsPerPoint,
  summarizeRedemptions,
} from "./redemption-value";

// 60,000 points for a $1,800 fare with $85 of surcharges.
const businessSaver = { pointsSpent: 60_000, cashValueCents: 180_000, feesPaidCents: 8_500 };

describe("netValueCents", () => {
  it("subtracts the cash still paid on the award", () => {
    expect(netValueCents(businessSaver)).toBe(171_500);
  });

  it("treats missing fees as none", () => {
    expect(netValueCents({ pointsSpent: 100, cashValueCents: 500 })).toBe(500);
    expect(netValueCents({ pointsSpent: 100, cashValueCents: 500, feesPaidCents: null })).toBe(500);
  });
});

describe("realizedCentsPerPoint", () => {
  it("divides net value by the points spent", () => {
    expect(realizedCentsPerPoint(businessSaver)).toBeCloseTo(2.858, 3);
  });

  it("goes negative when fees exceed what the booking was worth", () => {
    expect(
      realizedCentsPerPoint({ pointsSpent: 10_000, cashValueCents: 5_000, feesPaidCents: 9_000 })
    ).toBeCloseTo(-0.4, 5);
  });

  it("returns zero rather than dividing by zero points", () => {
    expect(realizedCentsPerPoint({ pointsSpent: 0, cashValueCents: 5_000 })).toBe(0);
  });
});

describe("compareToBaseline", () => {
  it("reports how far a redemption beat the program's nominal rate", () => {
    const result = compareToBaseline(businessSaver, 1.25);
    expect(result.beatBaseline).toBe(true);
    expect(result.centsPerPoint).toBeCloseTo(2.858, 3);
    expect(result.deltaPercent).toBeCloseTo(128.67, 1);
  });

  it("reports a shortfall as a negative delta", () => {
    const result = compareToBaseline({ pointsSpent: 10_000, cashValueCents: 8_000 }, 1.0);
    expect(result.beatBaseline).toBe(false);
    expect(result.deltaPercent).toBeCloseTo(-20, 5);
  });

  it("does not divide by a zero baseline", () => {
    expect(compareToBaseline(businessSaver, 0).deltaPercent).toBe(0);
  });
});

describe("summarizeRedemptions", () => {
  it("blends by total value over total points, not by averaging the rates", () => {
    const summary = summarizeRedemptions([
      // 100,000 points at a poor 1.0 c/pt...
      { pointsSpent: 100_000, cashValueCents: 100_000 },
      // ...and 1,000 points at a spectacular 10 c/pt.
      { pointsSpent: 1_000, cashValueCents: 10_000 },
    ]);

    expect(summary.count).toBe(2);
    expect(summary.totalPointsSpent).toBe(101_000);
    expect(summary.totalNetValueCents).toBe(110_000);
    // Weighted by size (~1.09), not the 5.5 a naive mean of the rates would give.
    expect(summary.blendedCentsPerPoint).toBeCloseTo(1.089, 3);
  });

  it("carries fees into the blended rate", () => {
    const summary = summarizeRedemptions([businessSaver, businessSaver]);
    expect(summary.totalCashValueCents).toBe(360_000);
    expect(summary.totalFeesPaidCents).toBe(17_000);
    expect(summary.totalNetValueCents).toBe(343_000);
    expect(summary.blendedCentsPerPoint).toBeCloseTo(2.858, 3);
  });

  it("is all zeroes with no redemptions", () => {
    expect(summarizeRedemptions([])).toMatchObject({
      count: 0,
      totalPointsSpent: 0,
      totalNetValueCents: 0,
      blendedCentsPerPoint: 0,
    });
  });
});
