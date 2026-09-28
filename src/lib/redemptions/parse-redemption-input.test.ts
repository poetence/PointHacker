import { describe, expect, it } from "vitest";
import { parseRedemptionInput } from "./parse-redemption-input";

const valid = {
  rewardsProgramId: "prog_1",
  description: "  ANA business, SFO to HND  ",
  pointsSpent: 60_000,
  cashValueCents: 180_000,
  feesPaidCents: 8_500,
  bookedOn: "2026-04-11",
};

describe("parseRedemptionInput", () => {
  it("accepts a full body and trims the text fields", () => {
    const result = parseRedemptionInput({ ...valid, notes: "  via Amex  " });
    expect(result).toMatchObject({
      input: {
        rewardsProgramId: "prog_1",
        description: "ANA business, SFO to HND",
        pointsSpent: 60_000,
        notes: "via Amex",
      },
    });
  });

  it("defaults fees to zero, goal to null, and opts into deducting the balance", () => {
    const result = parseRedemptionInput({ ...valid, feesPaidCents: undefined });
    expect(result).toMatchObject({
      input: { feesPaidCents: 0, awardGoalId: null, notes: null, deductFromBalance: true },
    });
  });

  it("only skips the balance deduction when explicitly told to", () => {
    expect(parseRedemptionInput({ ...valid, deductFromBalance: false })).toMatchObject({
      input: { deductFromBalance: false },
    });
  });

  it("treats blank text as absent", () => {
    expect(parseRedemptionInput({ ...valid, notes: "   ", awardGoalId: "" })).toMatchObject({
      input: { notes: null, awardGoalId: null },
    });
  });

  it("rejects a redemption that spent no points", () => {
    expect(parseRedemptionInput({ ...valid, pointsSpent: 0 })).toEqual({
      error: "pointsSpent must be a positive integer.",
    });
  });

  it("rejects non-integer or negative figures", () => {
    expect(parseRedemptionInput({ ...valid, pointsSpent: 1.5 })).toHaveProperty("error");
    expect(parseRedemptionInput({ ...valid, cashValueCents: -1 })).toHaveProperty("error");
    expect(parseRedemptionInput({ ...valid, feesPaidCents: -1 })).toHaveProperty("error");
  });

  it("requires a description and a program", () => {
    expect(parseRedemptionInput({ ...valid, description: "   " })).toEqual({
      error: "description is required.",
    });
    expect(parseRedemptionInput({ ...valid, rewardsProgramId: "" })).toEqual({
      error: "rewardsProgramId is required.",
    });
  });

  it("rejects an unparseable date", () => {
    expect(parseRedemptionInput({ ...valid, bookedOn: "not-a-date" })).toEqual({
      error: "bookedOn must be a valid date.",
    });
  });

  it("rejects a non-object body", () => {
    expect(parseRedemptionInput(null)).toHaveProperty("error");
    expect(parseRedemptionInput("nope")).toHaveProperty("error");
  });
});
