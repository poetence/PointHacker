// What a redemption was actually worth, after the fact. The mirror of
// `compute-best-redemptions`, which estimates what points *could* be worth:
// everything here is derived from a booking the user already made.
//
// Pure and DB-agnostic — callers map Prisma records into these input shapes.

export type RedemptionRecord = {
  pointsSpent: number;
  /** What the same booking would have cost in cash. */
  cashValueCents: number;
  /** Taxes and fees still paid in cash on the award — real money out. */
  feesPaidCents?: number | null;
};

/**
 * Cash the redemption actually saved: the fare it replaced, less the taxes and
 * fees still paid out of pocket. Subtracting fees matters — an award ticket
 * carrying $200 in surcharges saved $200 less than its headline fare.
 */
export function netValueCents({ cashValueCents, feesPaidCents }: RedemptionRecord): number {
  return cashValueCents - (feesPaidCents ?? 0);
}

/**
 * Cents of value realized per point. Zero points is treated as zero value
 * rather than dividing by zero; the API rejects that case at the boundary.
 */
export function realizedCentsPerPoint(record: RedemptionRecord): number {
  if (record.pointsSpent <= 0) {
    return 0;
  }
  return netValueCents(record) / record.pointsSpent;
}

export type BaselineComparison = {
  centsPerPoint: number;
  baselineCentsPerPoint: number;
  /** Percent above (positive) or below (negative) the program's nominal rate. */
  deltaPercent: number;
  beatBaseline: boolean;
};

/**
 * Measures a redemption against what the program's points are nominally worth
 * (`RewardsProgram.defaultRedemptionValueCents`), which is the number every
 * estimate in the app is built on — so this is the honest scorecard for
 * whether those estimates were worth following.
 */
export function compareToBaseline(
  record: RedemptionRecord,
  baselineCentsPerPoint: number
): BaselineComparison {
  const centsPerPoint = realizedCentsPerPoint(record);
  const deltaPercent =
    baselineCentsPerPoint > 0
      ? ((centsPerPoint - baselineCentsPerPoint) / baselineCentsPerPoint) * 100
      : 0;

  return {
    centsPerPoint,
    baselineCentsPerPoint,
    deltaPercent,
    beatBaseline: centsPerPoint > baselineCentsPerPoint,
  };
}

export type RedemptionSummary = {
  count: number;
  totalPointsSpent: number;
  totalCashValueCents: number;
  totalFeesPaidCents: number;
  /** Net cash saved across every redemption. */
  totalNetValueCents: number;
  /**
   * Blended rate across the whole history — total net value over total points,
   * not the mean of each redemption's rate, so a single large booking counts
   * for more than a small one.
   */
  blendedCentsPerPoint: number;
};

export function summarizeRedemptions(records: RedemptionRecord[]): RedemptionSummary {
  const totalPointsSpent = records.reduce((sum, r) => sum + r.pointsSpent, 0);
  const totalCashValueCents = records.reduce((sum, r) => sum + r.cashValueCents, 0);
  const totalFeesPaidCents = records.reduce((sum, r) => sum + (r.feesPaidCents ?? 0), 0);
  const totalNetValueCents = totalCashValueCents - totalFeesPaidCents;

  return {
    count: records.length,
    totalPointsSpent,
    totalCashValueCents,
    totalFeesPaidCents,
    totalNetValueCents,
    blendedCentsPerPoint: totalPointsSpent > 0 ? totalNetValueCents / totalPointsSpent : 0,
  };
}
