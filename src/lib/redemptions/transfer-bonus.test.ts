import { describe, expect, it } from "vitest";
import { applyTransferBonus, isBonusActive } from "./transfer-bonus";
import { computeBestRedemptions } from "./compute-best-redemptions";

const partner = {
  toProgram: { id: "to", name: "To", defaultRedemptionValueCents: 1.5 },
  ratioFrom: 1,
  ratioTo: 1,
};

describe("isBonusActive", () => {
  const bonus = { startsOn: new Date("2026-03-01"), endsOn: new Date("2026-03-31") };

  it("is active inclusive of both bounds and inactive outside them", () => {
    expect(isBonusActive(bonus, new Date("2026-03-01"))).toBe(true);
    expect(isBonusActive(bonus, new Date("2026-03-15"))).toBe(true);
    expect(isBonusActive(bonus, new Date("2026-03-31"))).toBe(true);
    expect(isBonusActive(bonus, new Date("2026-02-28"))).toBe(false);
    expect(isBonusActive(bonus, new Date("2026-04-01"))).toBe(false);
  });
});

describe("applyTransferBonus", () => {
  it("scales a 1:1 ratio by the bonus and reduces to whole-point blocks", () => {
    expect(applyTransferBonus(partner, 30)).toMatchObject({
      ratioFrom: 10,
      ratioTo: 13,
      activeBonusPercent: 30,
    });
    expect(applyTransferBonus(partner, 25)).toMatchObject({ ratioFrom: 4, ratioTo: 5 });
    expect(applyTransferBonus(partner, 100)).toMatchObject({ ratioFrom: 1, ratioTo: 2 });
  });

  it("works on non-1:1 base ratios", () => {
    expect(applyTransferBonus({ ...partner, ratioFrom: 1, ratioTo: 2 }, 20)).toMatchObject({
      ratioFrom: 5,
      ratioTo: 12,
    });
  });

  it("leaves the partner untouched for a zero bonus", () => {
    expect(applyTransferBonus(partner, 0)).toBe(partner);
  });

  it("flows through the ranking as more points received and a tagged option", () => {
    const [best] = computeBestRedemptions({
      program: { id: "from", name: "From", defaultRedemptionValueCents: 1 },
      balance: 10000,
      transferPartners: [applyTransferBonus(partner, 30)],
    });
    expect(best).toMatchObject({
      kind: "transfer",
      pointsReceived: 13000,
      totalValueCents: 19500,
      activeBonusPercent: 30,
    });
  });
});
