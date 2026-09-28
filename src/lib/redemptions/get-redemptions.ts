import { prisma } from "@/lib/prisma";
import {
  compareToBaseline,
  realizedCentsPerPoint,
  summarizeRedemptions,
  type BaselineComparison,
  type RedemptionSummary,
} from "./redemption-value";

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
  goal: { id: string; label: string } | null;
  centsPerPoint: number;
  /** How it fared against the program's nominal rate — the app's own estimate. */
  vsBaseline: BaselineComparison;
};

export type RedemptionHistory = {
  rows: RedemptionRow[];
  summary: RedemptionSummary;
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
          defaultRedemptionValueCents: true,
        },
      },
      awardGoal: { select: { id: true, label: true } },
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
      goal: record.awardGoal,
      centsPerPoint: realizedCentsPerPoint(value),
      vsBaseline: compareToBaseline(
        value,
        record.rewardsProgram.defaultRedemptionValueCents.toNumber()
      ),
    };
  });

  return { rows, summary: summarizeRedemptions(rows) };
}

/** The blended rate for the dashboard's stats strip. */
export async function getRedemptionSummary(userId: string): Promise<RedemptionSummary> {
  const records = await prisma.redemption.findMany({
    where: { userId },
    select: { pointsSpent: true, cashValueCents: true, feesPaidCents: true },
  });

  return summarizeRedemptions(records);
}
