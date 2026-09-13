import { describe, expect, it } from "vitest";
import { cardKey, scoreCards, type ScoringCard, type ScoringProfile } from "./score-cards";

const ur = {
  id: "ur",
  name: "Chase Ultimate Rewards",
  shortName: "Chase UR",
  type: "BANK_TRANSFERABLE" as const,
  pointsUnit: "points",
  defaultRedemptionValueCents: 1,
};
const cash = { ...ur, id: "cash", name: "Cash", shortName: null, type: "CASHBACK" as const };

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
    }).ranked[0];
    expect(reachable.bonusEarned).toBe(false);
    expect(reachable.welcomeBonusValueCents).toBe(0);

    const bigSpender = scoreCards({
      profile: profile({ monthlySpendCents: { ...profile().monthlySpendCents, OTHER: 100000 } }),
      cards: [card(bonus)],
      heldCardKeys: new Set(),
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
    const capped = scoreCards({ profile: profile({ maxAnnualFeeCents: 10000 }), cards, heldCardKeys: new Set() });
    expect(capped.ranked.map((r) => r.card.id)).toEqual(["free", "cash"]);

    const travelOnly = scoreCards({ profile: profile({ rewardsPreference: "TRAVEL" }), cards, heldCardKeys: new Set() });
    expect(travelOnly.ranked.map((r) => r.card.id)).toEqual(["free", "fee"]);

    const cashOnly = scoreCards({ profile: profile({ rewardsPreference: "CASHBACK" }), cards, heldCardKeys: new Set() });
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
    });
    // dining: 24,000 + 6,000 = 30,000; flat: 12,000 + 12,000 = 24,000
    expect(ranked.map((r) => r.card.id)).toEqual(["dining", "flat"]);
    expect(bestByCategory.DINING?.card.id).toBe("dining");
    expect(bestByCategory.OTHER?.card.id).toBe("flat");
    expect(bestByCategory.GAS).toBeUndefined();
  });
});
