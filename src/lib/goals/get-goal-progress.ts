import type { AwardGoal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { activeBonusFilter, toTransferPartnerOption } from "@/lib/redemptions/get-redemption-options";
import {
  computeGoalProgress,
  type GoalTargetPlan,
  type GoalTransferRoute,
} from "./compute-goal-progress";

export type GoalProgressResult = {
  plans: GoalTargetPlan[];
  /** Every active route into a target program, with active promos folded in — reused by the card gap-closer. */
  transferRoutes: GoalTransferRoute[];
};

export async function getGoalProgress(userId: string, goal: AwardGoal): Promise<GoalProgressResult> {
  const [awardCosts, balances] = await Promise.all([
    prisma.awardCost.findMany({
      where: { region: goal.region, cabin: goal.cabin, rewardsProgram: { isActive: true } },
      include: { rewardsProgram: true },
    }),
    prisma.pointsBalance.findMany({
      where: { userId },
      include: { rewardsProgram: { select: { name: true } } },
    }),
  ]);

  const targetIds = awardCosts.map((c) => c.rewardsProgramId);
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
    goal: { travelers: goal.travelers, roundTrip: goal.roundTrip },
    awardCosts: awardCosts.map((cost) => ({
      program: {
        id: cost.rewardsProgram.id,
        name: cost.rewardsProgram.name,
        shortName: cost.rewardsProgram.shortName,
        pointsUnit: cost.rewardsProgram.pointsUnit,
      },
      pointsOneWay: cost.pointsOneWay,
    })),
    balances: balances.map((b) => ({
      programId: b.rewardsProgramId,
      programName: b.rewardsProgram.name,
      balance: b.balance,
    })),
    transferRoutes,
  });

  return { plans, transferRoutes };
}
