import type { AwardGoal } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adjustForOrigin, isUsState, originZoneForState, type OriginZone } from "./origin-adjustment";
import { activeBonusFilter, toTransferPartnerOption } from "@/lib/redemptions/get-redemption-options";
import type {
  GoalAwardCost,
  GoalSpec,
  GoalTargetPlan,
  GoalTransferRoute,
} from "./compute-goal-progress";
import { allocateGoals, type ContestedBalance } from "./allocate-goals";
import { goalNames } from "./cabins";
import { programLabel } from "@/lib/format";

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

/** Enough to name and link a goal; `name` tells apart goals that share a label. */
export type GoalRef = { id: string; name: string };

export type GoalProgress = {
  goal: AwardGoal;
  /** The label, plus the cabin or tier when another goal has the same one. */
  name: string;
  /** Plans on the points left once higher-priority goals take their share — what every goal view shows. */
  shared: GoalProgressResult;
  /** Plans as if this goal had every balance to itself. */
  standalonePlans: GoalTargetPlan[];
  /** Goals ahead in line that took points this one would otherwise use. */
  squeezedBy: GoalRef[];
};

export type GoalsProgress = {
  /** Newest first, the order goals are listed in. */
  goals: GoalProgress[];
  byId: Map<string, GoalProgress>;
  /** Balances two or more goals want more of than the user holds, worst first. */
  contested: (Omit<ContestedBalance, "goalIds"> & { goals: GoalRef[] })[];
};

/**
 * Every goal's progress with one set of balances shared between them (see
 * `allocateGoals`) — a goal's figure depends on the goals ahead of it, so
 * there's deliberately no single-goal variant.
 */
export async function getGoalsProgress(userId: string): Promise<GoalsProgress> {
  const [goals, balances] = await Promise.all([
    prisma.awardGoal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.pointsBalance.findMany({
      where: { userId },
      include: { rewardsProgram: { select: { name: true, shortName: true } } },
    }),
  ]);

  const awardCosts = await Promise.all(goals.map(findAwardCosts));
  const transferRoutes = await findTransferRoutes(awardCosts.flat().map((c) => c.program.id));

  const { allocations, contested } = allocateGoals({
    goals: goals.map((goal, index) => ({
      id: goal.id,
      targetMonth: goal.targetMonth,
      createdAt: goal.createdAt,
      spec: toGoalSpec(goal),
      awardCosts: awardCosts[index],
    })),
    balances: balances.map((b) => ({
      programId: b.rewardsProgramId,
      programName: programLabel(b.rewardsProgram),
      balance: b.balance,
    })),
    transferRoutes,
  });

  const goalById = new Map(goals.map((goal) => [goal.id, goal]));
  const names = goalNames(goals);
  const toGoals = (ids: string[]): GoalRef[] => ids.map((id) => ({ id, name: names.get(id)! }));

  const byId = new Map<string, GoalProgress>();
  for (const allocation of allocations) {
    const targetIds = new Set(allocation.sharedPlans.map((plan) => plan.program.id));
    byId.set(allocation.goalId, {
      goal: goalById.get(allocation.goalId)!,
      name: names.get(allocation.goalId)!,
      shared: {
        plans: allocation.sharedPlans,
        transferRoutes: transferRoutes.filter((route) => targetIds.has(route.toProgramId)),
      },
      standalonePlans: allocation.standalonePlans,
      squeezedBy: toGoals(allocation.squeezedBy),
    });
  }

  return {
    goals: goals.map((goal) => byId.get(goal.id)!),
    byId,
    contested: contested.map(({ goalIds, ...balance }) => ({ ...balance, goals: toGoals(goalIds) })),
  };
}

/** Every active route into the given target programs, with active promos folded into the ratio. */
async function findTransferRoutes(targetIds: string[]): Promise<GoalTransferRoute[]> {
  if (targetIds.length === 0) return [];
  const partners = await prisma.transferPartner.findMany({
    where: { toProgramId: { in: [...new Set(targetIds)] }, isActive: true },
    include: {
      toProgram: true,
      fromProgram: { select: { id: true, name: true, shortName: true } },
      bonuses: activeBonusFilter(new Date()),
    },
  });

  return partners.map((partner) => {
    const option = toTransferPartnerOption(partner);
    return {
      fromProgramId: partner.fromProgram.id,
      fromProgramName: programLabel(partner.fromProgram),
      toProgramId: partner.toProgramId,
      ratioFrom: option.ratioFrom,
      ratioTo: option.ratioTo,
      minimumTransfer: option.minimumTransfer,
      activeBonusPercent: option.activeBonusPercent,
    };
  });
}
