export type RedemptionInput = {
  rewardsProgramId: string;
  description: string;
  pointsSpent: number;
  cashValueCents: number;
  feesPaidCents: number;
  bookedOn: Date;
  awardGoalId: string | null;
  notes: string | null;
  /**
   * Whether to subtract the points from the tracked balance. Explicit rather
   * than automatic: deleting a redemption later never puts points back, so the
   * balance change has to be something the user chose, not a hidden effect.
   */
  deductFromBalance: boolean;
};

export const MAX_POINTS_SPENT = 100_000_000;
export const MAX_CENTS = 100_000_000;

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/** Validates a JSON body for the redemptions API. Returns an input or an error. */
export function parseRedemptionInput(
  body: unknown
): { input: RedemptionInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }

  const {
    rewardsProgramId,
    description,
    pointsSpent,
    cashValueCents,
    feesPaidCents,
    bookedOn,
    awardGoalId,
    notes,
    deductFromBalance,
  } = body as Record<string, unknown>;

  if (typeof rewardsProgramId !== "string" || rewardsProgramId.length === 0) {
    return { error: "rewardsProgramId is required." };
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    return { error: "description is required." };
  }

  // A redemption that spent nothing has no rate to report, so reject zero here
  // rather than letting realizedCentsPerPoint quietly return 0.
  if (!isIntInRange(pointsSpent, 1, MAX_POINTS_SPENT)) {
    return { error: "pointsSpent must be a positive integer." };
  }

  if (!isIntInRange(cashValueCents, 0, MAX_CENTS)) {
    return { error: "cashValueCents must be a non-negative integer." };
  }

  const fees = feesPaidCents === undefined ? 0 : feesPaidCents;
  if (!isIntInRange(fees, 0, MAX_CENTS)) {
    return { error: "feesPaidCents must be a non-negative integer." };
  }

  if (typeof bookedOn !== "string") {
    return { error: "bookedOn must be a date string." };
  }
  const bookedOnDate = new Date(bookedOn);
  if (Number.isNaN(bookedOnDate.getTime())) {
    return { error: "bookedOn must be a valid date." };
  }

  if (awardGoalId !== undefined && awardGoalId !== null && typeof awardGoalId !== "string") {
    return { error: "awardGoalId must be a string." };
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return { error: "notes must be a string." };
  }

  if (deductFromBalance !== undefined && typeof deductFromBalance !== "boolean") {
    return { error: "deductFromBalance must be a boolean." };
  }

  return {
    input: {
      rewardsProgramId,
      description: description.trim(),
      pointsSpent,
      cashValueCents,
      feesPaidCents: fees,
      bookedOn: bookedOnDate,
      awardGoalId: typeof awardGoalId === "string" && awardGoalId.length > 0 ? awardGoalId : null,
      notes: typeof notes === "string" && notes.trim().length > 0 ? notes.trim() : null,
      deductFromBalance: deductFromBalance !== false,
    },
  };
}
