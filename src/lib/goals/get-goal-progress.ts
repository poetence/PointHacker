import type { AwardGoal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adjustForOrigin, isUsState, originZoneForState, type OriginZone } from "./origin-adjustment";
import { activeBonusFilter, toTransferPartnerOption } from "@/lib/redemptions/get-redemption-options";
import {
  computeGoalProgress,
  type GoalAwardCost,
  type GoalSpec,
  type GoalTargetPlan,
  type GoalTransferRoute,
} from "./compute-goal-progress";

export type GoalProgressResult = {
  plans: GoalTargetPlan[];
  /** Every active route into a target program, with active promos folded in — reused by the card gap-closer. */
  transferRoutes: GoalTransferRoute[];
};

const programSelect = { select: { id: true, name: true, shortName: true, pointsUnit: true } };

/** Flight and hotel goals price off different reference tables; both reduce to a per-unit cost. */
async function findAwardCosts(goal: AwardGoal): Promise<GoalAwardCost[]> {
  if (goal.kind === "HOTEL") {
    const rows = await prisma.hotelAwardCost.findMany({
      where: { region: goal.region, tier: goal.hotelTier, rewardsProgram: { isActive: true } },
      include: { rewardsProgram: programSelect },
    });
    return rows.map((row) => ({ program: row.rewardsProgram, pointsPerUnit: row.pointsPerNight }));
  }

  const rows = await prisma.awardCost.findMany({
    where: { region: goal.region, cabin: goal.cabin, rewardsProgram: { isActive: true } },
    include: { rewardsProgram: programSelect },
  });
  const zone = goalOriginZone(goal);
  return rows.map((row) => ({
    program: row.rewardsProgram,
    pointsPerUnit: adjustForOrigin(row.pointsOneWay, goal.region, zone),
  }));
}

/** The coast a flight goal departs from, or null when no origin is set (or it's a hotel goal). */
export function goalOriginZone(goal: AwardGoal): OriginZone | null {
  return goal.kind === "FLIGHT" && goal.originState && isUsState(goal.originState)
    ? originZoneForState(goal.originState)
    : null;
}

export function toGoalSpec(goal: AwardGoal): GoalSpec {
  return goal.kind === "HOTEL"
    ? { kind: "HOTEL", nights: goal.nights, rooms: goal.rooms }
    : { kind: "FLIGHT", travelers: goal.travelers, roundTrip: goal.roundTrip };
}

export async function getGoalProgress(userId: string, goal: AwardGoal): Promise<GoalProgressResult> {
  const [awardCosts, balances] = await Promise.all([
    findAwardCosts(goal),
    prisma.pointsBalance.findMany({
      where: { userId },
      include: { rewardsProgram: { select: { name: true } } },
    }),
  ]);

  const targetIds = awardCosts.map((c) => c.program.id);
  const partners = await prisma.transferPartner.findMany({
    where: { toProgramId: { in: targetIds }, isActive: true },
    include: {
      toProgram: true,
      fromProgram: { select: { id: true, name: true, shortName: true } },
      bonuses: activeBonusFilter(new Date()),
    },
  });

  const transferRoutes: GoalTransferRoute[] = partners.map((partner) => {
    const option = toTransferPartnerOption(partner);
    return {
      fromProgramId: partner.fromProgram.id,
      fromProgramName: partner.fromProgram.shortName ?? partner.fromProgram.name,
      toProgramId: partner.toProgramId,
      ratioFrom: option.ratioFrom,
      ratioTo: option.ratioTo,
      minimumTransfer: option.minimumTransfer,
      activeBonusPercent: option.activeBonusPercent,
    };
  });

  const plans = computeGoalProgress({
    goal: toGoalSpec(goal),
    awardCosts,
    balances: balances.map((b) => ({
      programId: b.rewardsProgramId,
      programName: b.rewardsProgram.name,
      balance: b.balance,
    })),
    transferRoutes,
  });

  return { plans, transferRoutes };
}
