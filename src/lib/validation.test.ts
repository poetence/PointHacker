import { describe, expect, it } from "vitest";
import { isIntInRange, isNonNegativeInteger, parseOptionalDate, toValidDate } from "./validation";

describe("isIntInRange", () => {
  it("accepts whole numbers inside the bounds, inclusive", () => {
    expect(isIntInRange(1, 1, 9)).toBe(true);
    expect(isIntInRange(9, 1, 9)).toBe(true);
  });

  it("rejects out-of-range, fractional and non-number values", () => {
    expect(isIntInRange(0, 1, 9)).toBe(false);
    expect(isIntInRange(10, 1, 9)).toBe(false);
    expect(isIntInRange(1.5, 1, 9)).toBe(false);
    expect(isIntInRange("3", 1, 9)).toBe(false);
    expect(isIntInRange(NaN, 1, 9)).toBe(false);
  });
});

describe("isNonNegativeInteger", () => {
  it("accepts zero and positive whole numbers only", () => {
    expect(isNonNegativeInteger(0)).toBe(true);
    expect(isNonNegativeInteger(100_000_000)).toBe(true);
    expect(isNonNegativeInteger(-1)).toBe(false);
    expect(isNonNegativeInteger(1.5)).toBe(false);
    expect(isNonNegativeInteger(Infinity)).toBe(false);
    expect(isNonNegativeInteger(null)).toBe(false);
  });
});

describe("toValidDate", () => {
  it("parses a date string and returns null for garbage", () => {
    expect(toValidDate("2026-10-07")?.toISOString()).toBe("2026-10-07T00:00:00.000Z");
    expect(toValidDate("nope")).toBeNull();
    expect(toValidDate("")).toBeNull();
  });
});

describe("parseOptionalDate", () => {
  it("leaves an absent field undefined", () => {
    expect(parseOptionalDate(undefined, "openedOn")).toEqual({ value: undefined });
  });

  it("clears with null only when the field is nullable", () => {
    expect(parseOptionalDate(null, "openedOn", { nullable: true })).toEqual({ value: null });
    expect(parseOptionalDate(null, "openedOn")).toEqual({ error: "openedOn must be a date string." });
  });

  it("names the field in each error", () => {
    expect(parseOptionalDate(5, "expiresOverrideAt")).toEqual({ error: "expiresOverrideAt must be a date string." });
    expect(parseOptionalDate("nope", "expiresOverrideAt")).toEqual({ error: "expiresOverrideAt must be a valid date." });
  });

  it("returns the parsed date", () => {
    expect(parseOptionalDate("2024-01-15", "openedOn")).toEqual({ value: new Date("2024-01-15") });
  });
});
