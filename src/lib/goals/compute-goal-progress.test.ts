import { describe, expect, it } from "vitest";
import {
  computeGoalProgress,
  pointsNeededForGoal,
  transferablePoints,
  type GoalTransferRoute,
} from "./compute-goal-progress";

const virgin = { id: "virgin", name: "Virgin Atlantic Flying Club", shortName: "Virgin Atlantic", pointsUnit: "points" };
const united = { id: "united", name: "United MileagePlus", shortName: "United", pointsUnit: "miles" };
const ana = { id: "ana", name: "ANA Mileage Club", shortName: "ANA", pointsUnit: "miles" };

const amexToVirgin: GoalTransferRoute = {
  fromProgramId: "amex",
  fromProgramName: "Amex MR",
  toProgramId: "virgin",
  ratioFrom: 1,
  ratioTo: 1,
};
const chaseToVirgin: GoalTransferRoute = { ...amexToVirgin, fromProgramId: "chase", fromProgramName: "Chase UR" };
const chaseToUnited: GoalTransferRoute = { ...chaseToVirgin, toProgramId: "united" };

const tokyoBusinessForTwo = { travelers: 2, roundTrip: true };

describe("pointsNeededForGoal", () => {
  it("multiplies the one-way price by legs and travelers", () => {
    expect(pointsNeededForGoal({ travelers: 2, roundTrip: true }, 47_500)).toBe(190_000);
    expect(pointsNeededForGoal({ travelers: 1, roundTrip: false }, 47_500)).toBe(47_500);
  });
});

describe("transferablePoints", () => {
  it("rounds down to whole ratio blocks and honors the minimum", () => {
    expect(transferablePoints(1_005, { ...amexToVirgin, ratioFrom: 10, ratioTo: 13 })).toBe(1_000);
    expect(transferablePoints(900, { ...amexToVirgin, minimumTransfer: 1_000 })).toBe(0);
    expect(transferablePoints(0, amexToVirgin)).toBe(0);
  });
});

describe("computeGoalProgress", () => {
  it("counts a balance held directly in the target program", () => {
    const [plan] = computeGoalProgress({
      goal: tokyoBusinessForTwo,
      awardCosts: [{ program: virgin, pointsOneWay: 47_500 }],
      balances: [{ programId: "virgin", programName: "Virgin", balance: 200_000 }],
      transferRoutes: [],
    });

    expect(plan).toMatchObject({
      pointsNeeded: 190_000,
      heldPoints: 200_000,
      transfers: [],
      pointsCovered: 190_000,
      shortfall: 0,
      isReachable: true,
    });
  });

  it("only transfers as much as needed, preferring the best ratio then the deepest balance", () => {
    const [plan] = computeGoalProgress({
      goal: tokyoBusinessForTwo,
      awardCosts: [{ program: virgin, pointsOneWay: 47_500 }],
      balances: [
        { programId: "virgin", programName: "Virgin", balance: 20_000 },
        { programId: "amex", programName: "Amex MR", balance: 100_000 },
        { programId: "chase", programName: "Chase UR", balance: 150_000 },
      ],
      transferRoutes: [
        // Amex is running +30%: 10 -> 13
        { ...amexToVirgin, ratioFrom: 10, ratioTo: 13, activeBonusPercent: 30 },
        chaseToVirgin,
      ],
    });

    expect(plan.heldPoints).toBe(20_000);
    expect(plan.transfers).toEqual([
      {
        fromProgramId: "amex",
        fromProgramName: "Amex MR",
        pointsToTransfer: 100_000,
        pointsReceived: 130_000,
        activeBonusPercent: 30,
      },
      {
        fromProgramId: "chase",
        fromProgramName: "Chase UR",
        pointsToTransfer: 40_000,
        pointsReceived: 40_000,
        activeBonusPercent: null,
      },
    ]);
    expect(plan.potentialPoints).toBe(20_000 + 130_000 + 150_000);
    expect(plan.isReachable).toBe(true);
  });

  it("rounds a partial transfer up to a whole block", () => {
    const [plan] = computeGoalProgress({
      goal: { travelers: 1, roundTrip: false },
      awardCosts: [{ program: virgin, pointsOneWay: 47_505 }],
      balances: [{ programId: "amex", programName: "Amex MR", balance: 100_000 }],
      transferRoutes: [{ ...amexToVirgin, ratioFrom: 10, ratioTo: 13 }],
    });

    // 47,505 / 13 = 3,654.2 blocks -> 3,655 blocks of 10 = 36,550 sent, 47,515 received.
    expect(plan.transfers[0]).toMatchObject({ pointsToTransfer: 36_550, pointsReceived: 47_515 });
  });

  it("reports the shortfall when balances and transfers don't reach the goal", () => {
    const [plan] = computeGoalProgress({
      goal: tokyoBusinessForTwo,
      awardCosts: [{ program: virgin, pointsOneWay: 47_500 }],
      balances: [{ programId: "amex", programName: "Amex MR", balance: 60_000 }],
      transferRoutes: [amexToVirgin],
    });

    expect(plan).toMatchObject({
      pointsCovered: 60_000,
      potentialPoints: 60_000,
      shortfall: 130_000,
      isReachable: false,
    });
    expect(plan.transfers[0].pointsToTransfer).toBe(60_000);
  });

  it("ignores sources that can't meet the route's minimum transfer", () => {
    const [plan] = computeGoalProgress({
      goal: { travelers: 1, roundTrip: false },
      awardCosts: [{ program: virgin, pointsOneWay: 10_000 }],
      balances: [{ programId: "amex", programName: "Amex MR", balance: 500 }],
      transferRoutes: [{ ...amexToVirgin, minimumTransfer: 1_000 }],
    });

    expect(plan.transfers).toEqual([]);
    expect(plan.shortfall).toBe(10_000);
  });

  it("ranks reachable programs first, then by smallest shortfall, then cheapest", () => {
    const plans = computeGoalProgress({
      goal: { travelers: 1, roundTrip: false },
      awardCosts: [
        { program: ana, pointsOneWay: 62_500 },
        { program: virgin, pointsOneWay: 47_500 },
        { program: united, pointsOneWay: 88_000 },
      ],
      balances: [{ programId: "chase", programName: "Chase UR", balance: 100_000 }],
      transferRoutes: [chaseToVirgin, chaseToUnited],
    });

    expect(plans.map((p) => p.program.id)).toEqual(["virgin", "united", "ana"]);
    expect(plans.map((p) => p.isReachable)).toEqual([true, true, false]);
  });

  it("returns no plans when nothing prices the trip", () => {
    expect(
      computeGoalProgress({ goal: tokyoBusinessForTwo, awardCosts: [], balances: [], transferRoutes: [] })
    ).toEqual([]);
  });
});
