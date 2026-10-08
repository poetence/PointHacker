// Shares one set of balances across all of a user's goals. computeGoalProgress
// plans each goal as if it had every point to itself, so two trips could both
// claim the same 120k and both read "bookable". Here goals take turns: the
// soonest trip plans first and keeps what its best route spends, and each goal
// after it plans on whatever is left. Pure and DB-agnostic.

import {
  computeGoalProgress,
  type GoalAwardCost,
  type GoalBalance,
  type GoalSpec,
  type GoalTargetPlan,
  type GoalTransferRoute,
} from "./compute-goal-progress";

export type AllocationGoal = {
  id: string;
  /** First of the travel month, if the user picked one. */
  targetMonth: Date | null;
  createdAt: Date;
  spec: GoalSpec;
  awardCosts: GoalAwardCost[];
};

export type GoalAllocation = {
  goalId: string;
  /** Plans as if this goal had every balance to itself. */
  standalonePlans: GoalTargetPlan[];
  /** Plans on what's left once every goal ahead of it has taken its share. */
  sharedPlans: GoalTargetPlan[];
  /** Points this goal's best shared plan spends, by source program — held back from the goals after it. */
  claims: Map<string, number>;
  /** Goals ahead in line that took points this goal would otherwise use. Empty unless it's worse off for it. */
  squeezedBy: string[];
};

export type ContestedBalance = {
  programId: string;
  programName: string;
  held: number;
  /** What every goal's standalone best plan would spend from this balance, added up. */
  wanted: number;
  /** The goals drawing on it, in priority order. */
  goalIds: string[];
};

export type GoalsAllocation = {
  /** One per goal, in priority order. */
  allocations: GoalAllocation[];
  /** Balances that two or more goals want more of than the user holds. */
  contested: ContestedBalance[];
};

/** Soonest trip first; undated goals after every dated one; ties go to the goal set first. */
export function compareGoalPriority(a: AllocationGoal, b: AllocationGoal): number {
  const aMonth = a.targetMonth?.getTime() ?? Infinity;
  const bMonth = b.targetMonth?.getTime() ?? Infinity;
  if (aMonth !== bMonth) return aMonth < bMonth ? -1 : 1;
  return a.createdAt.getTime() - b.createdAt.getTime();
}

/** What a plan takes out of each balance: the points held in the target (up to what's needed) plus every planned transfer. */
export function planSpend(plan: GoalTargetPlan): Map<string, number> {
  const spend = new Map<string, number>();
  const fromTarget = Math.min(plan.heldPoints, plan.pointsNeeded);
  if (fromTarget > 0) spend.set(plan.program.id, fromTarget);
  for (const step of plan.transfers) {
    spend.set(step.fromProgramId, (spend.get(step.fromProgramId) ?? 0) + step.pointsToTransfer);
  }
  return spend;
}

function coveredFraction(plan: GoalTargetPlan | undefined): number {
  return plan ? plan.pointsCovered / plan.pointsNeeded : 0;
}

export function allocateGoals({
  goals,
  balances,
  transferRoutes,
}: {
  goals: AllocationGoal[];
  balances: GoalBalance[];
  transferRoutes: GoalTransferRoute[];
}): GoalsAllocation {
  const remaining = new Map(balances.map((b) => [b.programId, b.balance]));
  const allocations: GoalAllocation[] = [];

  for (const goal of [...goals].sort(compareGoalPriority)) {
    const plan = (available: GoalBalance[]) =>
      computeGoalProgress({ goal: goal.spec, awardCosts: goal.awardCosts, balances: available, transferRoutes });

    const standalonePlans = plan(balances);
    const sharedPlans = plan(
      balances.map((b) => ({ ...b, balance: remaining.get(b.programId) ?? 0 }))
    );

    // Even a goal that can't be reached yet holds on to what it has saved —
    // those points are spoken for, which is the point of ranking the goals.
    const claims = sharedPlans[0] ? planSpend(sharedPlans[0]) : new Map<string, number>();
    for (const [programId, points] of claims) {
      remaining.set(programId, (remaining.get(programId) ?? 0) - points);
    }

    allocations.push({
      goalId: goal.id,
      standalonePlans,
      sharedPlans,
      claims,
      squeezedBy: squeezedBy(standalonePlans[0], sharedPlans[0], allocations),
    });
  }

  return { allocations, contested: findContested(allocations, balances) };
}

/** The earlier goals whose claims overlap the sources this goal would use alone — only when it lost ground. */
function squeezedBy(
  standaloneBest: GoalTargetPlan | undefined,
  sharedBest: GoalTargetPlan | undefined,
  earlier: GoalAllocation[]
): string[] {
  if (!standaloneBest || coveredFraction(sharedBest) >= coveredFraction(standaloneBest)) return [];

  const wanted = planSpend(standaloneBest);
  return earlier
    .filter((other) => [...other.claims.keys()].some((programId) => wanted.has(programId)))
    .map((other) => other.goalId);
}

function findContested(allocations: GoalAllocation[], balances: GoalBalance[]): ContestedBalance[] {
  return balances
    .map((balance) => {
      const wanting = allocations.flatMap((allocation) => {
        const best = allocation.standalonePlans[0];
        const points = best ? (planSpend(best).get(balance.programId) ?? 0) : 0;
        return points > 0 ? [{ goalId: allocation.goalId, points }] : [];
      });
      return {
        programId: balance.programId,
        programName: balance.programName,
        held: balance.balance,
        wanted: wanting.reduce((total, w) => total + w.points, 0),
        goalIds: wanting.map((w) => w.goalId),
      };
    })
    .filter((c) => c.goalIds.length > 1 && c.wanted > c.held)
    .sort((a, b) => b.wanted - b.held - (a.wanted - a.held));
}
