import { describe, expect, it } from "vitest";
import {
  OFF_PLAN_VALUE_SHARE,
  resolveCardTransfers,
  scaleRatio,
  valueCardPoints,
  type PointProgram,
  type PointRoute,
  type TransferTermsCard,
} from "./card-point-value";
import { NO_PERSONAL_RATES, type PersonalRates, type ProgramRateStatus } from "@/lib/redemptions/personal-rates";

function program(id: string, type: PointProgram["type"], cents: number): PointProgram {
  return { id, name: id, shortName: null, type, defaultRedemptionValueCents: cents };
}

const ur = program("ur", "BANK_TRANSFERABLE", 1);
const hyatt = program("hyatt", "HOTEL", 1.7);
const united = program("united", "AIRLINE", 1.3);
const hilton = program("hilton", "HOTEL", 0.5);
const southwest = program("southwest", "AIRLINE", 1.3);

function route(toProgram: PointProgram, ratioFrom = 1, ratioTo = 1, estimate: number | null = null): PointRoute {
  return { toProgram, ratioFrom, ratioTo, estimatedRedemptionValueCents: estimate };
}

const urRoutes = [route(hyatt), route(united)];

function card(overrides: Partial<TransferTermsCard>): TransferTermsCard {
  return {
    id: "card",
    issuer: "Chase",
    name: "Card",
    program: { id: "ur" },
    soloTransferShare: 1,
    transferRatioOverrides: {},
    routes: urRoutes,
    ...overrides,
  };
}

const reserve = card({ id: "csr", name: "Sapphire Reserve" });
const preferred = card({
  id: "csp",
  name: "Sapphire Preferred",
  transferRatioOverrides: { hyatt: { ratioFrom: 4, ratioTo: 3 } },
});
const freedom = card({ id: "cfu", name: "Freedom Unlimited", soloTransferShare: 0 });
const catalog = [reserve, preferred, freedom];

function rate(programId: string, centsPerPoint: number): ProgramRateStatus {
  return { programId, bookings: 3, pointsSpent: 100000, centsPerPoint, active: true };
}

function value(
  terms: TransferTermsCard,
  {
    from = ur,
    held = new Set<string>(),
    goals = null,
    rates = NO_PERSONAL_RATES,
  }: {
    from?: PointProgram;
    held?: Set<string>;
    goals?: Set<string> | null;
    rates?: PersonalRates;
  } = {}
) {
  return valueCardPoints({
    program: from,
    routes: terms.routes,
    transfers: resolveCardTransfers(terms, catalog, held),
    personalRates: rates,
    goalProgramIds: goals,
  });
}

describe("valueCardPoints", () => {
  it("values points at their best use, direct or through a partner", () => {
    const result = value(reserve);
    expect(result.centsPerPoint).toBe(1.7);
    expect(result.best.kind).toBe("transfer");
    expect(result.best.program.id).toBe("hyatt");
    expect(result.uses.map((u) => u.program.id)).toEqual(["hyatt", "united", "ur"]);
  });

  it("applies the route's ratio, and its own estimate over the program's", () => {
    const result = value(card({ routes: [route(hilton, 1, 2), route(united, 5, 4, 1.5)] }));
    const byProgram = new Map(result.uses.map((u) => [u.program.id, u]));
    expect(byProgram.get("hilton")?.valuePerPointCents).toBe(1); // 2 × 0.5¢
    expect(byProgram.get("united")?.pointsPerPoint).toBe(0.8);
    expect(byProgram.get("united")?.valuePerPointCents).toBeCloseTo(1.2); // 0.8 × the route's 1.5¢
  });

  it("uses the user's own rate in the destination over any estimate", () => {
    const unitedRate = rate("united", 2.2);
    const result = value(card({ routes: [route(hyatt), route(united, 1, 1, 1.5)] }), {
      rates: new Map([["united", unitedRate]]),
    });
    expect(result.best.program.id).toBe("united");
    expect(result.centsPerPoint).toBe(2.2);
    expect(result.best.personalRate).toBe(unitedRate);
  });

  it("discounts uses that book none of the goals, so a partner that does wins", () => {
    const result = value(reserve, { goals: new Set(["united"]) });
    const hyattUse = result.uses.find((u) => u.program.id === "hyatt")!;
    expect(hyattUse.servesGoals).toBe(false);
    expect(hyattUse.countedCents).toBeCloseTo(1.7 * OFF_PLAN_VALUE_SHARE);
    expect(result.best.program.id).toBe("united");
    expect(result.centsPerPoint).toBe(1.3);
  });

  it("treats a bank or cashback direct use as cash, which serves any goal", () => {
    const result = value(reserve, { goals: new Set(["somewhere-else"]) });
    expect(result.best.kind).toBe("direct");
    expect(result.best.servesGoals).toBe(true);
    expect(result.centsPerPoint).toBe(1);
  });

  it("discounts a co-brand card's own program when it books none of the goals", () => {
    const result = value(card({ program: { id: "southwest" }, routes: [] }), {
      from: southwest,
      goals: new Set(["united"]),
    });
    expect(result.best.servesGoals).toBe(false);
    expect(result.centsPerPoint).toBeCloseTo(1.3 * OFF_PLAN_VALUE_SHARE);
  });

  it("prefers the direct use on a tie", () => {
    const result = value(card({ routes: [route(program("p", "AIRLINE", 1))] }));
    expect(result.best.kind).toBe("direct");
  });

  it("counts only the direct use for a card that can't transfer", () => {
    const result = value(freedom);
    expect(result.uses.map((u) => u.kind)).toEqual(["direct"]);
    expect(result.centsPerPoint).toBe(1);
  });
});

describe("resolveCardTransfers", () => {
  it("gives a full-transfer card the program's ratios, or its own override", () => {
    expect(resolveCardTransfers(reserve, catalog, new Set()).factor("hyatt")).toBe(1);
    const csp = resolveCardTransfers(preferred, catalog, new Set());
    expect(csp.access).toEqual({ kind: "full" });
    expect(csp.factor("hyatt")).toBe(0.75);
    expect(csp.factor("united")).toBe(1);
    expect(csp.factor("not-a-partner")).toBe(0);
  });

  it("names the cards that unlock a card that can't transfer alone", () => {
    const cfu = resolveCardTransfers(freedom, catalog, new Set());
    expect(cfu.factor("hyatt")).toBe(0);
    expect(cfu.access).toEqual({
      kind: "none",
      fullCards: [
        { issuer: "Chase", name: "Sapphire Reserve" },
        { issuer: "Chase", name: "Sapphire Preferred" },
      ],
    });
  });

  it("moves pooled points on the best terms among the wallet's full-transfer cards", () => {
    const withPreferred = resolveCardTransfers(freedom, catalog, new Set(["csp"]));
    expect(withPreferred.access).toEqual({
      kind: "pooled",
      withCards: [{ issuer: "Chase", name: "Sapphire Preferred" }],
    });
    expect(withPreferred.factor("hyatt")).toBe(0.75);
    expect(resolveCardTransfers(freedom, catalog, new Set(["csp", "csr"])).factor("hyatt")).toBe(1);
    // A full-transfer card pools too: the Preferred's points reach Hyatt 1:1 through a Reserve.
    expect(resolveCardTransfers(preferred, catalog, new Set(["csr"])).factor("hyatt")).toBe(1);
  });

  it("transfers at a share of the ratio for a reduced card, and never pools across programs", () => {
    const doubleCash = card({ id: "dc", program: { id: "typ" }, soloTransferShare: 0.7 });
    const result = resolveCardTransfers(doubleCash, [...catalog, doubleCash], new Set(["csr"]));
    expect(result.factor("united")).toBe(0.7);
    expect(result.access).toEqual({ kind: "reduced", share: 0.7, fullCards: [] });
  });
});

describe("scaleRatio", () => {
  it("keeps whole-point blocks", () => {
    expect(scaleRatio({ ratioFrom: 1, ratioTo: 1 }, 0.7)).toEqual({ ratioFrom: 10, ratioTo: 7 });
    expect(scaleRatio({ ratioFrom: 5, ratioTo: 4 }, 0.75)).toEqual({ ratioFrom: 5, ratioTo: 3 });
  });

  it("returns the route untouched at 1 and null at 0", () => {
    const base = { ratioFrom: 1, ratioTo: 2 };
    expect(scaleRatio(base, 1)).toBe(base);
    expect(scaleRatio(base, 0)).toBeNull();
  });
});
