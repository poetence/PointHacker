import { describe, expect, it } from "vitest";
import {
  formatCents,
  formatCentsPerPoint,
  formatSignedCount,
  programLabel,
  unitLabel,
  unitSingular,
} from "./format";

describe("formatCents", () => {
  it("formats cents as US dollars", () => {
    expect(formatCents(123456)).toBe("$1,234.56");
    expect(formatCents(-500)).toBe("-$5.00");
  });
});

describe("formatCentsPerPoint", () => {
  it("shows two decimals and a cent sign", () => {
    expect(formatCentsPerPoint(1.5)).toBe("1.50¢");
  });
});

describe("programLabel", () => {
  it("prefers the short name and falls back to the full name", () => {
    expect(programLabel({ name: "American Express Membership Rewards", shortName: "Amex MR" })).toBe("Amex MR");
    expect(programLabel({ name: "World of Hyatt", shortName: null })).toBe("World of Hyatt");
    expect(programLabel({ name: "World of Hyatt" })).toBe("World of Hyatt");
  });
});

describe("unitSingular / unitLabel", () => {
  it("names miles as miles and everything else as points", () => {
    expect(unitSingular("miles")).toBe("mile");
    expect(unitSingular("points")).toBe("point");
    expect(unitLabel("miles")).toBe("Miles");
    expect(unitLabel("points")).toBe("Points");
  });
});

describe("formatSignedCount", () => {
  it("signs the change and groups thousands", () => {
    expect(formatSignedCount(1500)).toBe("+1,500");
    expect(formatSignedCount(-200)).toBe("−200");
  });
});
