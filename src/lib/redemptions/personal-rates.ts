// A user's own realized rate per program, fed back into the rankings in place
// of the program's `defaultRedemptionValueCents` once they've logged enough
// bookings there. Layered on top of `computeBestRedemptions`: these helpers
// rewrite its *inputs*, and the ranking itself is untouched.
//
// Pure and DB-agnostic — callers map Prisma records into these input shapes.

import type { ProgramType } from "@/lib/program-type";
import type {
  RedemptionOption,
  RedemptionProgram,
  TransferPartnerOption,
} from "./compute-best-redemptions";
import { summarizeRedemptions, type RedemptionRecord } from "./redemption-value";

/** Fewer bookings than this and one lucky (or bad) redemption would swing every ranking. */
export const MIN_BOOKINGS_FOR_PERSONAL_RATE = 3;

/**
 * Only programs where a logged booking means "spent this program's points on
 * an award there". A booking logged against bank points was most likely a
 * transfer, so its rate says nothing about the direct option it would replace;
 * cashback is a fixed rate with nothing to learn.
 */
const PERSONAL_RATE_PROGRAM_TYPES: ReadonlySet<ProgramType> = new Set(["AIRLINE", "HOTEL"]);

export function supportsPersonalRate(type: ProgramType): boolean {
  return PERSONAL_RATE_PROGRAM_TYPES.has(type);
}

export type PersonalRateRecord = RedemptionRecord & {
  programId: string;
  programType: ProgramType;
};

export type ProgramRateStatus = {
  programId: string;
  bookings: number;
  pointsSpent: number;
  /** Blended across this program's bookings — never below zero, even when fees outran the fare. */
  centsPerPoint: number;
  /** Enough bookings that the rankings use this rate. */
  active: boolean;
};

/**
 * Every eligible program the user has logged a booking in, active or not —
 * the inactive ones are what the redemptions page counts down to.
 */
export function summarizeProgramRates(records: PersonalRateRecord[]): ProgramRateStatus[] {
  const byProgram = new Map<string, PersonalRateRecord[]>();
  for (const record of records) {
    if (!supportsPersonalRate(record.programType)) continue;
    byProgram.set(record.programId, [...(byProgram.get(record.programId) ?? []), record]);
  }

  return [...byProgram].map(([programId, programRecords]) => {
    const summary = summarizeRedemptions(programRecords);
    return {
      programId,
      bookings: summary.count,
      pointsSpent: summary.totalPointsSpent,
      centsPerPoint: Math.max(0, summary.blendedCentsPerPoint),
      active: summary.count >= MIN_BOOKINGS_FOR_PERSONAL_RATE,
    };
  });
}

/** Active personal rates by program id. */
export type PersonalRates = ReadonlyMap<string, ProgramRateStatus>;

export function toPersonalRates(statuses: ProgramRateStatus[]): PersonalRates {
  return new Map(statuses.filter((s) => s.active).map((s) => [s.programId, s]));
}

export const NO_PERSONAL_RATES: PersonalRates = new Map();

/** The program with its own rate swapped in, when the user has one. */
export function personalizeProgram(
  program: RedemptionProgram,
  rates: PersonalRates
): RedemptionProgram {
  const rate = rates.get(program.id);
  return rate ? { ...program, defaultRedemptionValueCents: rate.centsPerPoint } : program;
}

/**
 * A route valued at the user's own rate in the destination program. That
 * overrides the route's own estimate too: what they actually got there beats
 * a ballpark of what points moved along this route tend to fetch.
 */
export function personalizePartner(
  partner: TransferPartnerOption,
  rates: PersonalRates
): TransferPartnerOption {
  const rate = rates.get(partner.toProgram.id);
  if (!rate) return partner;
  return {
    ...partner,
    toProgram: personalizeProgram(partner.toProgram, rates),
    estimatedRedemptionValueCents: rate.centsPerPoint,
  };
}

/** The rate behind an option's value, if it's the user's own — the program the points are finally spent in. */
export function personalRateFor(
  option: RedemptionOption,
  rates: PersonalRates
): ProgramRateStatus | null {
  return rates.get(option.kind === "direct" ? option.programId : option.partnerProgramId) ?? null;
}
