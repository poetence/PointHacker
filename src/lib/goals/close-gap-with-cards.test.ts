import { describe, expect, it } from "vitest";
import { closeGapWithCards } from "./close-gap-with-cards";
import type { GoalTargetPlan, GoalTransferRoute } from "./compute-goal-progress";

const virgin = { id: "virgin", name: "Virgin Atlantic Flying Club", shortName: "Virgin Atlantic", pointsUnit: "points" };
const united = { id: "united", name: "United MileagePlus", shortName: "United", pointsUnit: "miles" };

function plan(program: typeof virgin, pointsNeeded: number, shortfall: number): GoalTargetPlan {
  return {
    program,
    pointsNeeded,
    heldPoints: 0,
    transfers: [],
    potentialPoints: pointsNeeded - shortfall,
    pointsCovered: pointsNeeded - shortfall,
    shortfall,
    isReachable: shortfall === 0,
  };
}

const amexToVirgin: GoalTransferRoute = {
  fromProgramId: "amex",
  fromProgramName: "Amex MR",
  toProgramId: "virgin",
  ratioFrom: 10,
  ratioTo: 13,
  activeBonusPercent: 30,
};
const chaseToUnited: GoalTransferRoute = {
  fromProgramId: "chase",
  fromProgramName: "Chase UR",
  toProgramId: "united",
  ratioFrom: 1,
  ratioTo: 1,
};

describe("closeGapWithCards", () => {
  it("credits a bonus in the target program directly", () => {
    const result = closeGapWithCards({
      plans: [plan(united, 176_000, 50_000)],
      cards: [{ id: "united-explorer", programId: "united", welcomeBonusPoints: 60_000 }],
      transferRoutes: [],
    });

    expect(result.get("united-explorer")).toMatchObject({
      targetProgramId: "united",
      pointsContributed: 60_000,
      shortfallBefore: 50_000,
      shortfallAfter: 0,
      closesGap: true,
      viaTransfer: null,
    });
  });

  it("routes a bonus through a transfer partner with the promo applied", () => {
    const result = closeGapWithCards({
      plans: [plan(virgin, 190_000, 100_000)],
      cards: [{ id: "amex-gold", programId: "amex", welcomeBonusPoints: 60_000 }],
      transferRoutes: [amexToVirgin],
    });

    expect(result.get("amex-gold")).toMatchObject({
      targetProgramId: "virgin",
      pointsContributed: 78_000,
      shortfallAfter: 22_000,
      closesGap: false,
      viaTransfer: { activeBonusPercent: 30 },
    });
  });

  it("prefers a plan it closes outright over one it merely dents, then the cheaper trip", () => {
    const result = closeGapWithCards({
      plans: [plan(united, 176_000, 10_000), plan(virgin, 190_000, 200_000)],
      cards: [{ id: "chase-sapphire", programId: "chase", welcomeBonusPoints: 60_000 }],
      transferRoutes: [
        chaseToUnited,
        { ...chaseToUnited, toProgramId: "virgin" },
      ],
    });

    expect(result.get("chase-sapphire")).toMatchObject({ targetProgramId: "united", closesGap: true });

    const cheaper = closeGapWithCards({
      plans: [plan(united, 176_000, 10_000), plan(virgin, 95_000, 10_000)],
      cards: [{ id: "chase-sapphire", programId: "chase", welcomeBonusPoints: 60_000 }],
      transferRoutes: [chaseToUnited, { ...chaseToUnited, toProgramId: "virgin" }],
    });
    expect(cheaper.get("chase-sapphire")?.targetProgramId).toBe("virgin");
  });

  it("skips cards with no bonus, no route, or nothing left to close", () => {
    const result = closeGapWithCards({
      plans: [plan(united, 176_000, 0), plan(virgin, 190_000, 100_000)],
      cards: [
        { id: "no-bonus", programId: "virgin", welcomeBonusPoints: null },
        { id: "no-route", programId: "citi", welcomeBonusPoints: 60_000 },
        { id: "already-there", programId: "united", welcomeBonusPoints: 60_000 },
      ],
      transferRoutes: [],
    });

    expect(result.size).toBe(0);
  });
});
