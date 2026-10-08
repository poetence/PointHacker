import { describe, expect, it } from "vitest";
import { allocateGoals, compareGoalPriority, planSpend, type AllocationGoal } from "./allocate-goals";
import { computeGoalProgress, type GoalTransferRoute } from "./compute-goal-progress";

const virgin = { id: "virgin", name: "Virgin Atlantic Flying Club", shortName: "Virgin Atlantic", pointsUnit: "points" };
const hyatt = { id: "hyatt", name: "World of Hyatt", shortName: "Hyatt", pointsUnit: "points" };

const amexToVirgin: GoalTransferRoute = {
  fromProgramId: "amex",
  fromProgramName: "Amex MR",
  toProgramId: "virgin",
  ratioFrom: 1,
  ratioTo: 1,
};
const chaseToHyatt: GoalTransferRoute = {
  fromProgramId: "chase",
  fromProgramName: "Chase UR",
  toProgramId: "hyatt",
  ratioFrom: 1,
  ratioTo: 1,
};
const transferRoutes = [amexToVirgin, chaseToHyatt];

const oneWayForOne = { kind: "FLIGHT" as const, travelers: 1, roundTrip: false };

function flightGoal(id: string, pointsPerUnit: number, extra: Partial<AllocationGoal> = {}): AllocationGoal {
  return {
    id,
    targetMonth: null,
    createdAt: new Date("2026-01-01"),
    spec: oneWayForOne,
    awardCosts: [{ program: virgin, pointsPerUnit }],
    ...extra,
  };
}

const amex = (balance: number) => ({ programId: "amex", programName: "Amex MR", balance });

describe("compareGoalPriority", () => {
  const goal = (targetMonth: string | null, createdAt: string) =>
    flightGoal("g", 1, { targetMonth: targetMonth ? new Date(targetMonth) : null, createdAt: new Date(createdAt) });

  it("puts the soonest trip first and undated goals last", () => {
    const sorted = [
      goal(null, "2026-01-01"),
      goal("2027-03-01", "2026-05-01"),
      goal("2026-12-01", "2026-06-01"),
    ].sort(compareGoalPriority);
    expect(sorted.map((g) => g.targetMonth?.toISOString().slice(0, 7) ?? null)).toEqual(["2026-12", "2027-03", null]);
  });

  it("breaks ties with the goal that was set first, so a new goal never pushes an old one back", () => {
    const older = goal(null, "2026-01-01");
    const newer = goal(null, "2026-02-01");
    expect([newer, older].sort(compareGoalPriority)).toEqual([older, newer]);
  });
});

describe("planSpend", () => {
  it("counts held points up to what's needed plus each transfer", () => {
    const [plan] = computeGoalProgress({
      goal: oneWayForOne,
      awardCosts: [{ program: virgin, pointsPerUnit: 60_000 }],
      balances: [{ programId: "virgin", programName: "Virgin", balance: 20_000 }, amex(100_000)],
      transferRoutes,
    });
    expect(planSpend(plan)).toEqual(new Map([["virgin", 20_000], ["amex", 40_000]]));
  });

  it("takes only what's needed from a target balance that's already big enough", () => {
    const [plan] = computeGoalProgress({
      goal: oneWayForOne,
      awardCosts: [{ program: virgin, pointsPerUnit: 60_000 }],
      balances: [{ programId: "virgin", programName: "Virgin", balance: 90_000 }],
      transferRoutes,
    });
    expect(planSpend(plan)).toEqual(new Map([["virgin", 60_000]]));
  });
});

describe("allocateGoals", () => {
  it("doesn't let two goals both claim the same points", () => {
    const { allocations } = allocateGoals({
      goals: [flightGoal("london", 60_000), flightGoal("tokyo", 60_000, { createdAt: new Date("2026-02-01") })],
      balances: [amex(100_000)],
      transferRoutes,
    });

    const [london, tokyo] = allocations;
    expect(london.goalId).toBe("london");
    expect(london.sharedPlans[0].isReachable).toBe(true);
    expect(london.claims).toEqual(new Map([["amex", 60_000]]));

    // On its own Tokyo is bookable; after London takes its 60k only 40k is left.
    expect(tokyo.standalonePlans[0].isReachable).toBe(true);
    expect(tokyo.sharedPlans[0]).toMatchObject({ pointsCovered: 40_000, shortfall: 20_000, isReachable: false });
    expect(tokyo.squeezedBy).toEqual(["london"]);
  });

  it("lets the sooner trip go first regardless of the order goals arrive in", () => {
    const { allocations } = allocateGoals({
      goals: [flightGoal("someday", 60_000), flightGoal("spring", 60_000, { targetMonth: new Date("2027-04-01") })],
      balances: [amex(100_000)],
      transferRoutes,
    });
    expect(allocations.map((a) => a.goalId)).toEqual(["spring", "someday"]);
    expect(allocations[0].sharedPlans[0].isReachable).toBe(true);
  });

  it("holds back what an unreachable goal has saved", () => {
    const { allocations } = allocateGoals({
      goals: [flightGoal("big", 150_000), flightGoal("small", 30_000, { createdAt: new Date("2026-02-01") })],
      balances: [amex(100_000)],
      transferRoutes,
    });
    const [big, small] = allocations;
    expect(big.claims.get("amex")).toBe(100_000);
    expect(small.sharedPlans[0].pointsCovered).toBe(0);
    expect(small.squeezedBy).toEqual(["big"]);
  });

  it("leaves goals that draw on different balances untouched", () => {
    const hotel: AllocationGoal = {
      id: "maui",
      targetMonth: null,
      createdAt: new Date("2026-02-01"),
      spec: { kind: "HOTEL", nights: 2, rooms: 1 },
      awardCosts: [{ program: hyatt, pointsPerUnit: 25_000 }],
    };
    const { allocations, contested } = allocateGoals({
      goals: [flightGoal("london", 60_000), hotel],
      balances: [amex(100_000), { programId: "chase", programName: "Chase UR", balance: 50_000 }],
      transferRoutes,
    });
    for (const allocation of allocations) {
      expect(allocation.sharedPlans).toEqual(allocation.standalonePlans);
      expect(allocation.squeezedBy).toEqual([]);
    }
    expect(contested).toEqual([]);
  });

  it("doesn't call a goal squeezed when there's enough for everyone", () => {
    const { allocations, contested } = allocateGoals({
      goals: [flightGoal("london", 40_000), flightGoal("tokyo", 40_000, { createdAt: new Date("2026-02-01") })],
      balances: [amex(100_000)],
      transferRoutes,
    });
    expect(allocations.every((a) => a.squeezedBy.length === 0 && a.sharedPlans[0].isReachable)).toBe(true);
    expect(contested).toEqual([]);
  });

  it("flags a balance two goals want more of than is held", () => {
    const { contested } = allocateGoals({
      goals: [flightGoal("london", 60_000), flightGoal("tokyo", 70_000, { createdAt: new Date("2026-02-01") })],
      balances: [amex(100_000)],
      transferRoutes,
    });
    expect(contested).toEqual([
      { programId: "amex", programName: "Amex MR", held: 100_000, wanted: 130_000, goalIds: ["london", "tokyo"] },
    ]);
  });

  it("handles a goal no program prices", () => {
    const { allocations } = allocateGoals({
      goals: [flightGoal("nowhere", 1, { awardCosts: [] }), flightGoal("london", 60_000, { createdAt: new Date("2026-02-01") })],
      balances: [amex(100_000)],
      transferRoutes,
    });
    expect(allocations[0]).toMatchObject({ sharedPlans: [], claims: new Map(), squeezedBy: [] });
    expect(allocations[1].sharedPlans[0].isReachable).toBe(true);
  });
});
