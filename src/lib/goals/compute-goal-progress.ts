// Core "how close am I" logic for an award goal: for every program with an
// award price for the trip, works out how many points the trip needs, how many
// the user already holds there, and how many they could move in from other
// balances via transfer partners (with any active bonus already folded into
// the ratio by the caller). Pure and DB-agnostic — callers map Prisma records
// into these input shapes.

import { groupBy } from "@/lib/group-by";

export type GoalSpec =
  | { kind: "FLIGHT"; travelers: number; roundTrip: boolean }
  | { kind: "HOTEL"; nights: number; rooms: number };

export type GoalProgram = {
  id: string;
  name: string;
  shortName: string | null;
  pointsUnit: string;
};

export type GoalAwardCost = {
  program: GoalProgram;
  /** Price of one unit in the program's currency: one-way per person (flights) or one night per room (hotels). */
  pointsPerUnit: number;
};

export type GoalBalance = {
  programId: string;
  programName: string;
  balance: number;
};

/** A transfer relationship with any active promo already applied to the ratio. */
export type GoalTransferRoute = {
  fromProgramId: string;
  fromProgramName: string;
  toProgramId: string;
  ratioFrom: number;
  ratioTo: number;
  minimumTransfer?: number | null;
  activeBonusPercent?: number | null;
};

export type GoalTransferStep = {
  fromProgramId: string;
  fromProgramName: string;
  /** Points to move out of the source balance to cover (its share of) the gap. */
  pointsToTransfer: number;
  pointsReceived: number;
  activeBonusPercent: number | null;
};

export type GoalTargetPlan = {
  program: GoalProgram;
  pointsNeeded: number;
  /** Balance already sitting in the target program. */
  heldPoints: number;
  /** Transfers that would close the gap, best ratio first — only as much as needed. */
  transfers: GoalTransferStep[];
  /** held + everything that could be transferred in, ignoring the goal size. */
  potentialPoints: number;
  /** min(pointsNeeded, potentialPoints) — what the progress bar shows. */
  pointsCovered: number;
  shortfall: number;
  isReachable: boolean;
};

export type ComputeGoalProgressInput = {
  goal: GoalSpec;
  awardCosts: GoalAwardCost[];
  balances: GoalBalance[];
  transferRoutes: GoalTransferRoute[];
};

export function pointsNeededForGoal(goal: GoalSpec, pointsPerUnit: number): number {
  return goal.kind === "FLIGHT"
    ? pointsPerUnit * (goal.roundTrip ? 2 : 1) * goal.travelers
    : pointsPerUnit * goal.nights * goal.rooms;
}

/** Points a source balance can send along a route in whole ratio blocks, honoring the minimum. */
export function transferablePoints(balance: number, route: GoalTransferRoute): number {
  const usable = Math.floor(balance / route.ratioFrom) * route.ratioFrom;
  const minimum = route.minimumTransfer ?? 0;
  return usable > 0 && usable >= minimum ? usable : 0;
}

export function computeGoalProgress({
  goal,
  awardCosts,
  balances,
  transferRoutes,
}: ComputeGoalProgressInput): GoalTargetPlan[] {
  const balanceByProgramId = new Map(balances.map((b) => [b.programId, b.balance]));
  const routesByTargetId = groupBy(transferRoutes, (route) => route.toProgramId);

  return awardCosts
    .map((awardCost) =>
      planTarget(goal, awardCost, balanceByProgramId, routesByTargetId.get(awardCost.program.id) ?? [])
    )
    .sort(compareGoalPlans);
}

function planTarget(
  goal: GoalSpec,
  awardCost: GoalAwardCost,
  balanceByProgramId: Map<string, number>,
  routes: GoalTransferRoute[]
): GoalTargetPlan {
  const pointsNeeded = pointsNeededForGoal(goal, awardCost.pointsPerUnit);
  const heldPoints = balanceByProgramId.get(awardCost.program.id) ?? 0;
  const sources = rankTransferSources(routes, balanceByProgramId);

  const potentialPoints = sources.reduce(
    (total, { route, maxTransferable }) => total + receivedFor(maxTransferable, route),
    heldPoints
  );
  const pointsCovered = Math.min(pointsNeeded, potentialPoints);
  const shortfall = pointsNeeded - pointsCovered;

  return {
    program: awardCost.program,
    pointsNeeded,
    heldPoints,
    transfers: planTransfers(sources, Math.max(0, pointsNeeded - heldPoints)),
    potentialPoints,
    pointsCovered,
    shortfall,
    isReachable: shortfall === 0,
  };
}

/** Reachable programs first, then the smallest shortfall, then the cheapest award. */
function compareGoalPlans(a: GoalTargetPlan, b: GoalTargetPlan): number {
  return (
    Number(b.isReachable) - Number(a.isReachable) ||
    a.shortfall - b.shortfall ||
    a.pointsNeeded - b.pointsNeeded
  );
}

type TransferSource = { route: GoalTransferRoute; balance: number; maxTransferable: number };

/**
 * Sources that can send anything, best ratio first (a bonus route beats a plain
 * 1:1), then the deepest balance so the plan is as few transfers as possible.
 * Ties break on the raw balance, not `maxTransferable`, which rounds to blocks.
 */
function rankTransferSources(
  routes: GoalTransferRoute[],
  balanceByProgramId: Map<string, number>
): TransferSource[] {
  return routes
    .map((route) => {
      const balance = balanceByProgramId.get(route.fromProgramId) ?? 0;
      return { route, balance, maxTransferable: transferablePoints(balance, route) };
    })
    .filter((source) => source.maxTransferable > 0)
    .sort((a, b) => transferRatio(b.route) - transferRatio(a.route) || b.balance - a.balance);
}

/** Walks the ranked sources, moving only as much as it takes to close the gap. */
function planTransfers(sources: TransferSource[], gap: number): GoalTransferStep[] {
  const transfers: GoalTransferStep[] = [];
  let gapLeft = gap;

  for (const { route, maxTransferable } of sources) {
    if (gapLeft <= 0) break;

    const pointsToTransfer = Math.min(pointsToCover(gapLeft, route), maxTransferable);
    const pointsReceived = receivedFor(pointsToTransfer, route);
    transfers.push({
      fromProgramId: route.fromProgramId,
      fromProgramName: route.fromProgramName,
      pointsToTransfer,
      pointsReceived,
      activeBonusPercent: route.activeBonusPercent ?? null,
    });
    gapLeft -= pointsReceived;
  }

  return transfers;
}

/** Points to send so at least `gap` arrives: whole ratio blocks, never under the route's minimum. */
function pointsToCover(gap: number, route: GoalTransferRoute): number {
  const blocksNeeded = Math.ceil(gap / route.ratioTo);
  return Math.max(blocksNeeded * route.ratioFrom, route.minimumTransfer ?? 0);
}

/** Points that arrive in the target for `pointsSent` along a route (promo already in the ratio). */
export function receivedFor(pointsSent: number, route: GoalTransferRoute): number {
  return (pointsSent / route.ratioFrom) * route.ratioTo;
}

function transferRatio(route: GoalTransferRoute): number {
  return route.ratioTo / route.ratioFrom;
}
