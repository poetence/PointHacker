import { describe, expect, it } from "vitest";
import { computeBestRedemptions } from "./compute-best-redemptions";
import {
  MIN_BOOKINGS_FOR_PERSONAL_RATE,
  NO_PERSONAL_RATES,
  personalizePartner,
  personalizeProgram,
  personalRateFor,
  summarizeProgramRates,
  toPersonalRates,
  type PersonalRateRecord,
} from "./personal-rates";

const hyattBooking = (pointsSpent: number, cashValueCents: number, feesPaidCents = 0): PersonalRateRecord => ({
  programId: "hyatt",
  programType: "HOTEL",
  pointsSpent,
  cashValueCents,
  feesPaidCents,
});

// Three Hyatt stays: 2.0¢, 2.5¢ and 3.0¢ — blended by points, (40k+25k+45k)/(20k+10k+15k) ≈ 2.444¢.
const threeHyattStays = [
  hyattBooking(20_000, 40_000),
  hyattBooking(10_000, 25_000),
  hyattBooking(15_000, 45_000),
];

const hyatt = { id: "hyatt", name: "World of Hyatt", defaultRedemptionValueCents: 1.7 };
const chase = { id: "chase", name: "Chase Ultimate Rewards", defaultRedemptionValueCents: 1.0 };

describe("summarizeProgramRates", () => {
  it("blends a program's bookings by total value over total points", () => {
    const [status] = summarizeProgramRates(threeHyattStays);
    expect(status.programId).toBe("hyatt");
    expect(status.bookings).toBe(3);
    expect(status.pointsSpent).toBe(45_000);
    expect(status.centsPerPoint).toBeCloseTo(110_000 / 45_000, 6);
  });

  it(`turns a rate on at ${MIN_BOOKINGS_FOR_PERSONAL_RATE} bookings, not before`, () => {
    expect(summarizeProgramRates(threeHyattStays.slice(0, 2))[0].active).toBe(false);
    expect(summarizeProgramRates(threeHyattStays)[0].active).toBe(true);
  });

  it("nets out fees and never reports a rate below zero", () => {
    const [status] = summarizeProgramRates([
      hyattBooking(10_000, 5_000, 9_000),
      hyattBooking(10_000, 5_000, 9_000),
      hyattBooking(10_000, 5_000, 9_000),
    ]);
    expect(status.centsPerPoint).toBe(0);
  });

  it("keeps programs apart", () => {
    const statuses = summarizeProgramRates([
      ...threeHyattStays,
      { programId: "ana", programType: "AIRLINE", pointsSpent: 60_000, cashValueCents: 300_000 },
    ]);
    expect(statuses.map((s) => [s.programId, s.bookings])).toEqual([
      ["hyatt", 3],
      ["ana", 1],
    ]);
  });

  it("skips bank and cashback programs, whose bookings don't measure their direct value", () => {
    const asType = (programType: PersonalRateRecord["programType"]) =>
      threeHyattStays.map((r) => ({ ...r, programId: programType, programType }));
    expect(
      summarizeProgramRates([...asType("BANK_TRANSFERABLE"), ...asType("CASHBACK"), ...asType("OTHER")])
    ).toEqual([]);
  });
});

describe("toPersonalRates", () => {
  it("keeps only the rates that are switched on", () => {
    const rates = toPersonalRates(
      summarizeProgramRates([
        ...threeHyattStays,
        { programId: "ana", programType: "AIRLINE", pointsSpent: 60_000, cashValueCents: 300_000 },
      ])
    );
    expect([...rates.keys()]).toEqual(["hyatt"]);
  });
});

describe("personalizeProgram", () => {
  const rates = toPersonalRates(summarizeProgramRates(threeHyattStays));

  it("swaps in the user's own rate", () => {
    expect(personalizeProgram(hyatt, rates).defaultRedemptionValueCents).toBeCloseTo(2.444, 3);
  });

  it("leaves a program without one alone", () => {
    expect(personalizeProgram(chase, rates)).toBe(chase);
    expect(personalizeProgram(hyatt, NO_PERSONAL_RATES)).toBe(hyatt);
  });
});

describe("personalizePartner", () => {
  const rates = toPersonalRates(summarizeProgramRates(threeHyattStays));

  it("values a route at the destination's personal rate, over the route's own estimate", () => {
    const partner = { toProgram: hyatt, ratioFrom: 1, ratioTo: 1, estimatedRedemptionValueCents: 2.0 };
    const personalized = personalizePartner(partner, rates);
    expect(personalized.estimatedRedemptionValueCents).toBeCloseTo(2.444, 3);
    expect(personalized.toProgram.defaultRedemptionValueCents).toBeCloseTo(2.444, 3);
    expect(personalized.ratioFrom).toBe(1);
  });

  it("keeps a promo already folded into the ratio", () => {
    const partner = { toProgram: hyatt, ratioFrom: 10, ratioTo: 13, activeBonusPercent: 30 };
    const personalized = personalizePartner(partner, rates);
    expect([personalized.ratioFrom, personalized.ratioTo, personalized.activeBonusPercent]).toEqual([10, 13, 30]);
  });

  it("leaves routes into other programs alone", () => {
    const partner = { toProgram: chase, ratioFrom: 1, ratioTo: 1 };
    expect(personalizePartner(partner, rates)).toBe(partner);
  });
});

describe("feeding personal rates into computeBestRedemptions", () => {
  it("can reorder the ranking without the ranking itself changing", () => {
    const rates = toPersonalRates(
      summarizeProgramRates([
        { programId: "united", programType: "AIRLINE", pointsSpent: 30_000, cashValueCents: 18_000 },
        { programId: "united", programType: "AIRLINE", pointsSpent: 30_000, cashValueCents: 18_000 },
        { programId: "united", programType: "AIRLINE", pointsSpent: 30_000, cashValueCents: 18_000 },
      ])
    );
    const united = { id: "united", name: "United MileagePlus", defaultRedemptionValueCents: 1.3 };
    const partners = [
      { toProgram: hyatt, ratioFrom: 1, ratioTo: 1 },
      { toProgram: united, ratioFrom: 1, ratioTo: 1, estimatedRedemptionValueCents: 1.8 },
    ];

    const rank = (personal: typeof rates) =>
      computeBestRedemptions({
        program: personalizeProgram(chase, personal),
        balance: 10_000,
        transferPartners: partners.map((p) => personalizePartner(p, personal)),
      }).map((o) => (o.kind === "direct" ? "direct" : o.partnerProgramId));

    // United's 1.8¢ route estimate leads until the user's own 0.6¢ bookings replace it.
    expect(rank(NO_PERSONAL_RATES)).toEqual(["united", "hyatt", "direct"]);
    expect(rank(rates)).toEqual(["hyatt", "direct", "united"]);
  });
});

describe("personalRateFor", () => {
  const rates = toPersonalRates(summarizeProgramRates(threeHyattStays));

  it("looks at the program the points are finally spent in", () => {
    const [transfer, direct] = computeBestRedemptions({
      program: chase,
      balance: 1_000,
      transferPartners: [{ toProgram: personalizeProgram(hyatt, rates), ratioFrom: 1, ratioTo: 1 }],
    });
    expect(personalRateFor(transfer, rates)?.programId).toBe("hyatt");
    expect(personalRateFor(direct, rates)).toBeNull();
  });
});
