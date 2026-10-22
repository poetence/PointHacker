import { describe, expect, it } from "vitest";
import {
  cardKey,
  indexHeldCards,
  isHeldCard,
  scoreCards,
  type ScoringCard,
  type ScoringProfile,
} from "./score-cards";
import { NO_PERSONAL_RATES, type ProgramRateStatus } from "@/lib/redemptions/personal-rates";

const ur = {
  id: "ur",
  name: "Chase Ultimate Rewards",
  shortName: "Chase UR",
  type: "BANK_TRANSFERABLE" as const,
  pointsUnit: "points",
  defaultRedemptionValueCents: 1,
};
const cash = { ...ur, id: "cash", name: "Cash", shortName: null, type: "CASHBACK" as const };
const united = {
  id: "united",
  name: "United MileagePlus",
  shortName: "United",
  type: "AIRLINE" as const,
  pointsUnit: "miles",
  defaultRedemptionValueCents: 1.2,
};

function rate(programId: string, centsPerPoint: number): ProgramRateStatus {
  return { programId, bookings: 3, pointsSpent: 150000, centsPerPoint, active: true };
}

function card(overrides: Partial<ScoringCard>): ScoringCard {
  return {
    id: "c",
    issuer: "Chase",
    name: "Card",
    program: ur,
    annualFeeCents: 0,
    welcomeBonusPoints: null,
    welcomeBonusSpendCents: null,
    welcomeBonusMonths: null,
    baseEarnRate: 1,
    earnRates: {},
    soloTransferShare: 1,
    transferRatioOverrides: {},
    routes: [],
    ...overrides,
  };
}

function profile(overrides: Partial<ScoringProfile> = {}): ScoringProfile {
  return {
    monthlySpendCents: {
      DINING: 50000,
      GROCERIES: 0,
      TRAVEL: 0,
      GAS: 0,
      TRANSIT: 0,
      ONLINE: 0,
      OTHER: 50000,
    },
    rewardsPreference: "ANY",
    maxAnnualFeeCents: null,
    ...overrides,
  };
}

describe("scoreCards", () => {
  it("uses category overrides where present and the base rate elsewhere", () => {
    const { ranked } = scoreCards({
      profile: profile(),
      cards: [card({ baseEarnRate: 1.5, earnRates: { DINING: 3 } })],
      heldCardKeys: new Set(),
      personalRates: NO_PERSONAL_RATES,
      goalProgramIds: null,
    });
    // $500 × 12 × 3 = 18,000 dining; $500 × 12 × 1.5 = 9,000 other
    expect(ranked[0].pointsByCategory.DINING).toBe(18000);
    expect(ranked[0].pointsByCategory.OTHER).toBe(9000);
    expect(ranked[0].annualPoints).toBe(27000);
    expect(ranked[0].earnValueCents).toBe(27000);
  });

  it("only counts the welcome bonus when spend over the window meets the threshold", () => {
    const bonus = { welcomeBonusPoints: 60000, welcomeBonusSpendCents: 400000, welcomeBonusMonths: 3 };
    const reachable = scoreCards({
      profile: profile(), // $1,000/mo × 3 = $3,000 < $4,000
      cards: [card(bonus)],
      heldCardKeys: new Set(),
      personalRates: NO_PERSONAL_RATES,
      goalProgramIds: null,
    }).ranked[0];
    expect(reachable.bonusEarned).toBe(false);
    expect(reachable.welcomeBonusValueCents).toBe(0);

    const bigSpender = scoreCards({
      profile: profile({ monthlySpendCents: { ...profile().monthlySpendCents, OTHER: 100000 } }),
      cards: [card(bonus)],
      heldCardKeys: new Set(),
      personalRates: NO_PERSONAL_RATES,
      goalProgramIds: null,
    }).ranked[0];
    expect(bigSpender.bonusEarned).toBe(true);
    expect(bigSpender.welcomeBonusValueCents).toBe(60000);
    expect(bigSpender.firstYearValueCents - bigSpender.ongoingValueCents).toBe(60000);
  });

  it("subtracts the annual fee from both first-year and ongoing value", () => {
    const { ranked } = scoreCards({
      profile: profile(),
      cards: [card({ annualFeeCents: 9500 })],
      heldCardKeys: new Set(),
      personalRates: NO_PERSONAL_RATES,
      goalProgramIds: null,
    });
    expect(ranked[0].ongoingValueCents).toBe(12000 - 9500);
    expect(ranked[0].firstYearValueCents).toBe(12000 - 9500);
  });

  it("drops cards over the fee cap and outside the rewards preference", () => {
    const cards = [
      card({ id: "free", name: "Free" }),
      card({ id: "fee", name: "Fee", annualFeeCents: 55000 }),
      card({ id: "cash", name: "Cash", program: cash }),
    ];
    const capped = scoreCards({ profile: profile({ maxAnnualFeeCents: 10000 }), cards, heldCardKeys: new Set(), personalRates: NO_PERSONAL_RATES, goalProgramIds: null });
    expect(capped.ranked.map((r) => r.card.id)).toEqual(["free", "cash"]);

    const travelOnly = scoreCards({ profile: profile({ rewardsPreference: "TRAVEL" }), cards, heldCardKeys: new Set(), personalRates: NO_PERSONAL_RATES, goalProgramIds: null });
    expect(travelOnly.ranked.map((r) => r.card.id)).toEqual(["free", "fee"]);

    const cashOnly = scoreCards({ profile: profile({ rewardsPreference: "CASHBACK" }), cards, heldCardKeys: new Set(), personalRates: NO_PERSONAL_RATES, goalProgramIds: null });
    expect(cashOnly.ranked.map((r) => r.card.id)).toEqual(["cash"]);
  });

  it("moves cards already in the wallet to alreadyHeld, by catalog id or case-insensitive name", () => {
    const { ranked, alreadyHeld } = scoreCards({
      profile: profile(),
      cards: [
        card({ id: "held-by-name", issuer: "Chase", name: "Sapphire Preferred" }),
        card({ id: "held-by-id", issuer: "Amex", name: "Gold" }),
        card({ id: "new" }),
      ],
      heldCardKeys: new Set([cardKey("chase", "sapphire preferred")]),
      heldCardProductIds: new Set(["held-by-id"]),
      personalRates: NO_PERSONAL_RATES,
      goalProgramIds: null,
    });
    expect(alreadyHeld.map((c) => c.id)).toEqual(["held-by-name", "held-by-id"]);
    expect(ranked.map((r) => r.card.id)).toEqual(["new"]);
  });

  it("ranks by first-year value and picks the best card per spent category", () => {
    const { ranked, bestByCategory } = scoreCards({
      profile: profile(),
      cards: [
        card({ id: "dining", earnRates: { DINING: 4 } }),
        card({ id: "flat", baseEarnRate: 2 }),
      ],
      heldCardKeys: new Set(),
      personalRates: NO_PERSONAL_RATES,
      goalProgramIds: null,
    });
    // dining: 24,000 + 6,000 = 30,000; flat: 12,000 + 12,000 = 24,000
    expect(ranked.map((r) => r.card.id)).toEqual(["dining", "flat"]);
    expect(bestByCategory.DINING?.card.id).toBe("dining");
    expect(bestByCategory.OTHER?.card.id).toBe("flat");
    expect(bestByCategory.GAS).toBeUndefined();
  });

  it("values a card's points at the user's own rate in its program, bonus included", () => {
    const unitedRate = rate("united", 2);
    const { ranked } = scoreCards({
      profile: profile(),
      cards: [
        card({
          id: "united-card",
          program: united,
          welcomeBonusPoints: 50000,
          welcomeBonusSpendCents: 300000,
          welcomeBonusMonths: 3,
        }),
        card({ id: "ur-card" }),
      ],
      heldCardKeys: new Set(),
      personalRates: new Map([["united", unitedRate]]),
      goalProgramIds: null,
    });
    const [unitedCard, urCard] = ranked;
    // 12,000 miles × 2¢, and the 50,000-mile bonus at the same 2¢
    expect(unitedCard.pointValue.centsPerPoint).toBe(2);
    expect(unitedCard.pointValue.best.personalRate).toBe(unitedRate);
    expect(unitedCard.earnValueCents).toBe(24000);
    expect(unitedCard.welcomeBonusValueCents).toBe(100000);
    expect(urCard.pointValue.centsPerPoint).toBe(1);
    expect(urCard.pointValue.best.personalRate).toBeNull();
  });

  it("lets a low personal rate drop a card down the ranking and out of a category", () => {
    const cards = [
      card({ id: "united-card", program: united, earnRates: { DINING: 3 } }),
      card({ id: "ur-card", baseEarnRate: 1.5 }),
    ];
    // At the 1.2¢ estimate: United 24,000 × 1.2 = 28,800¢ beats UR 18,000 × 1¢.
    const estimated = scoreCards({ profile: profile(), cards, heldCardKeys: new Set(), personalRates: NO_PERSONAL_RATES, goalProgramIds: null });
    expect(estimated.ranked.map((r) => r.card.id)).toEqual(["united-card", "ur-card"]);
    expect(estimated.bestByCategory.DINING?.card.id).toBe("united-card");

    // At a 0.4¢ personal rate: 24,000 × 0.4 = 9,600¢, and dining 3 × 0.4 < 1.5 × 1.
    const personal = scoreCards({
      profile: profile(),
      cards,
      heldCardKeys: new Set(),
      personalRates: new Map([["united", rate("united", 0.4)]]),
      goalProgramIds: null,
    });
    expect(personal.ranked.map((r) => r.card.id)).toEqual(["ur-card", "united-card"]);
    expect(personal.bestByCategory.DINING?.card.id).toBe("ur-card");
  });

  it("values a bank card through its partners, discounting those that book none of the goals", () => {
    const hyatt = { ...united, id: "hyatt", name: "World of Hyatt", type: "HOTEL" as const, defaultRedemptionValueCents: 1.7 };
    const transferable = card({
      id: "ur-card",
      routes: [
        { toProgram: hyatt, ratioFrom: 1, ratioTo: 1, estimatedRedemptionValueCents: null },
        { toProgram: united, ratioFrom: 1, ratioTo: 1, estimatedRedemptionValueCents: null },
      ],
    });
    const coBrand = card({ id: "united-card", program: united });
    const score = (goalProgramIds: Set<string> | null) =>
      scoreCards({
        profile: profile(),
        cards: [transferable, coBrand],
        heldCardKeys: new Set(),
        personalRates: NO_PERSONAL_RATES,
        goalProgramIds,
      }).ranked;

    // No goals: 12,000 points at Hyatt's 1.7¢ beat United's 1.2¢.
    const open = score(null);
    expect(open.map((r) => r.card.id)).toEqual(["ur-card", "united-card"]);
    expect(open[0].earnValueCents).toBeCloseTo(12000 * 1.7);
    expect(open[0].pointValue.best.program.id).toBe("hyatt");

    // Saving for a United trip: Hyatt counts at half, so the transfer to United wins —
    // and only the discount on Hyatt, not on United, applies.
    const forUnited = score(new Set(["united"]));
    expect(forUnited[0].pointValue.best.program.id).toBe("united");
    expect(forUnited[0].pointValue.centsPerPoint).toBe(1.2);
  });

  it("lets a card that can't transfer alone pool with a full-transfer card in the wallet", () => {
    const hyatt = { ...united, id: "hyatt", name: "World of Hyatt", type: "HOTEL" as const, defaultRedemptionValueCents: 1.7 };
    const routes = [{ toProgram: hyatt, ratioFrom: 1, ratioTo: 1, estimatedRedemptionValueCents: null }];
    const cards = [
      card({ id: "reserve", name: "Sapphire Reserve", routes }),
      card({ id: "freedom", name: "Freedom Unlimited", routes, soloTransferShare: 0 }),
    ];
    const freedomValue = (heldCardKeys: Set<string>) =>
      scoreCards({ profile: profile(), cards, heldCardKeys, personalRates: NO_PERSONAL_RATES, goalProgramIds: null })
        .ranked.find((r) => r.card.id === "freedom")!.pointValue;

    expect(freedomValue(new Set()).centsPerPoint).toBe(1);
    expect(freedomValue(new Set()).access.kind).toBe("none");
    const pooled = freedomValue(new Set([cardKey("Chase", "Sapphire Reserve")]));
    expect(pooled.centsPerPoint).toBe(1.7);
    expect(pooled.access.kind).toBe("pooled");
  });
});

describe("indexHeldCards / isHeldCard", () => {
  const held = indexHeldCards([
    { issuer: " Chase ", productName: "Sapphire Preferred", cardProductId: null },
    { issuer: "Amex", productName: "My gold card", cardProductId: "amex-gold" },
  ]);

  it("matches a hand-typed wallet card by issuer + name, ignoring case and spacing", () => {
    expect(isHeldCard({ id: "csp", issuer: "chase", name: "sapphire preferred" }, held)).toBe(true);
  });

  it("matches a catalog-picked wallet card by id even when the names differ", () => {
    expect(isHeldCard({ id: "amex-gold", issuer: "American Express", name: "Gold" }, held)).toBe(true);
  });

  it("leaves other cards alone", () => {
    expect(isHeldCard({ id: "venture", issuer: "Capital One", name: "Venture X" }, held)).toBe(false);
  });
});
