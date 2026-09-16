// Core "how close am I" logic for an award goal: for every program with an
// award price for the trip, works out how many points the trip needs, how many
// the user already holds there, and how many they could move in from other
// balances via transfer partners (with any active bonus already folded into
// the ratio by the caller). Pure and DB-agnostic — callers map Prisma records
// into these input shapes.

export type GoalSpec = {
  travelers: number;
  roundTrip: boolean;
};

export type GoalProgram = {
  id: string;
  name: string;
  shortName: string | null;
  pointsUnit: string;
};

export type GoalAwardCost = {
  program: GoalProgram;
  /** One-way, per-person price in the program's currency. */
  pointsOneWay: number;
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

export function pointsNeededForGoal(goal: GoalSpec, pointsOneWay: number): number {
  return pointsOneWay * (goal.roundTrip ? 2 : 1) * goal.travelers;
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
  const balanceByProgramId = new Map(balances.map((b) => [b.programId, b]));
  const routesByTargetId = new Map<string, GoalTransferRoute[]>();
  for (const route of transferRoutes) {
    const existing = routesByTargetId.get(route.toProgramId) ?? [];
    existing.push(route);
    routesByTargetId.set(route.toProgramId, existing);
  }

  const plans = awardCosts.map((cost) =>
    planTarget(goal, cost, balanceByProgramId, routesByTargetId.get(cost.program.id) ?? [])
  );

  return plans.sort(
    (a, b) =>
      Number(b.isReachable) - Number(a.isReachable) ||
      a.shortfall - b.shortfall ||
      a.pointsNeeded - b.pointsNeeded
  );
}

function planTarget(
  goal: GoalSpec,
  cost: GoalAwardCost,
  balanceByProgramId: Map<string, GoalBalance>,
  routes: GoalTransferRoute[]
): GoalTargetPlan {
  const pointsNeeded = pointsNeededForGoal(goal, cost.pointsOneWay);
  const heldPoints = balanceByProgramId.get(cost.program.id)?.balance ?? 0;

  // Best ratio first (a bonus route beats a plain 1:1), then the deepest balance
  // so the plan is as few transfers as possible.
  const sources = routes
    .map((route) => ({ route, balance: balanceByProgramId.get(route.fromProgramId)?.balance ?? 0 }))
    .filter(({ route, balance }) => transferablePoints(balance, route) > 0)
    .sort(
      (a, b) =>
        b.route.ratioTo / b.route.ratioFrom - a.route.ratioTo / a.route.ratioFrom ||
        b.balance - a.balance
    );

  let potentialPoints = heldPoints;
  let remaining = Math.max(0, pointsNeeded - heldPoints);
  const transfers: GoalTransferStep[] = [];

  for (const { route, balance } of sources) {
    const maxTransferable = transferablePoints(balance, route);
    potentialPoints += (maxTransferable / route.ratioFrom) * route.ratioTo;
    if (remaining <= 0) continue;

    // Round the needed amount up to a whole ratio block and at least the minimum.
    const blocksNeeded = Math.ceil(remaining / route.ratioTo);
    const wanted = Math.max(blocksNeeded * route.ratioFrom, route.minimumTransfer ?? 0);
    const pointsToTransfer = Math.min(wanted, maxTransferable);
    const pointsReceived = (pointsToTransfer / route.ratioFrom) * route.ratioTo;

    transfers.push({
      fromProgramId: route.fromProgramId,
      fromProgramName: route.fromProgramName,
      pointsToTransfer,
      pointsReceived,
      activeBonusPercent: route.activeBonusPercent ?? null,
    });
    remaining -= pointsReceived;
  }

  const pointsCovered = Math.min(pointsNeeded, potentialPoints);
  const shortfall = pointsNeeded - pointsCovered;

  return {
    program: cost.program,
    pointsNeeded,
    heldPoints,
    transfers,
    potentialPoints,
    pointsCovered,
    shortfall,
    isReachable: shortfall === 0,
  };
}
