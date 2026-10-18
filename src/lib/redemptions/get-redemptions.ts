import type { ProgramType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  compareToBaseline,
  realizedCentsPerPoint,
  summarizeRedemptions,
  type BaselineComparison,
  type RedemptionSummary,
} from "./redemption-value";
import {
  summarizeProgramRates,
  toPersonalRates,
  type PersonalRateRecord,
  type PersonalRates,
  type ProgramRateStatus,
} from "./personal-rates";

/** A logged redemption plus what it turned out to be worth. */
export type RedemptionRow = {
  id: string;
  description: string;
  pointsSpent: number;
  cashValueCents: number;
  feesPaidCents: number;
  bookedOn: Date;
  notes: string | null;
  program: { id: string; name: string; shortName: string | null; pointsUnit: string };
  goal: { id: string; label: string; booked: boolean } | null;
  centsPerPoint: number;
  /** How it fared against the program's nominal rate — the app's own estimate. */
  vsBaseline: BaselineComparison;
};

export type RedemptionHistory = {
  rows: RedemptionRow[];
  summary: RedemptionSummary;
  /** Each program's own rate, including ones with too few bookings to be used yet. */
  programRates: ProgramRateStatus[];
};

/** Newest booking first — the order the history page reads in. */
export async function getRedemptions(userId: string): Promise<RedemptionHistory> {
  const records = await prisma.redemption.findMany({
    where: { userId },
    orderBy: { bookedOn: "desc" },
    include: {
      rewardsProgram: {
        select: {
          id: true,
          name: true,
          shortName: true,
          pointsUnit: true,
          type: true,
          defaultRedemptionValueCents: true,
        },
      },
      awardGoal: { select: { id: true, label: true, bookedAt: true } },
    },
  });

  const rows = records.map((record): RedemptionRow => {
    const value = {
      pointsSpent: record.pointsSpent,
      cashValueCents: record.cashValueCents,
      feesPaidCents: record.feesPaidCents,
    };

    return {
      id: record.id,
      description: record.description,
      pointsSpent: record.pointsSpent,
      cashValueCents: record.cashValueCents,
      feesPaidCents: record.feesPaidCents,
      bookedOn: record.bookedOn,
      notes: record.notes,
      program: {
        id: record.rewardsProgram.id,
        name: record.rewardsProgram.name,
        shortName: record.rewardsProgram.shortName,
        pointsUnit: record.rewardsProgram.pointsUnit,
      },
      goal: record.awardGoal && {
        id: record.awardGoal.id,
        label: record.awardGoal.label,
        booked: record.awardGoal.bookedAt !== null,
      },
      centsPerPoint: realizedCentsPerPoint(value),
      vsBaseline: compareToBaseline(
        value,
        record.rewardsProgram.defaultRedemptionValueCents.toNumber()
      ),
    };
  });

  return {
    rows,
    summary: summarizeRedemptions(rows),
    programRates: summarizeProgramRates(records.map(toPersonalRateRecord)),
  };
}

/** The rates every ranking should use in place of the programs' estimates, for this user. */
export async function getPersonalRates(userId: string): Promise<PersonalRates> {
  const records = await prisma.redemption.findMany({
    where: { userId },
    select: {
      rewardsProgramId: true,
      pointsSpent: true,
      cashValueCents: true,
      feesPaidCents: true,
      rewardsProgram: { select: { type: true } },
    },
  });

  return toPersonalRates(summarizeProgramRates(records.map(toPersonalRateRecord)));
}

/** The blended rate for the dashboard's stats strip. */
export async function getRedemptionSummary(userId: string): Promise<RedemptionSummary> {
  const records = await prisma.redemption.findMany({
    where: { userId },
    select: { pointsSpent: true, cashValueCents: true, feesPaidCents: true },
  });

  return summarizeRedemptions(records);
}

function toPersonalRateRecord(record: {
  rewardsProgramId: string;
  pointsSpent: number;
  cashValueCents: number;
  feesPaidCents: number;
  rewardsProgram: { type: ProgramType };
}): PersonalRateRecord {
  return {
    programId: record.rewardsProgramId,
    programType: record.rewardsProgram.type,
    pointsSpent: record.pointsSpent,
    cashValueCents: record.cashValueCents,
    feesPaidCents: record.feesPaidCents,
  };
}
