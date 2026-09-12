import { describe, expect, it } from "vitest";
import { isRegionRelevant } from "./region-relevance";

describe("isRegionRelevant", () => {
  it("cashback is always relevant, regardless of region or its own (empty) regions list", () => {
    expect(isRegionRelevant({ type: "CASHBACK", regions: [] }, "ASIA")).toBe(true);
    expect(isRegionRelevant({ type: "CASHBACK", regions: ["EUROPE"] }, "ASIA")).toBe(true);
  });

  it("airline/hotel is relevant only when the region is in its regions list", () => {
    expect(isRegionRelevant({ type: "AIRLINE", regions: ["ASIA"] }, "ASIA")).toBe(true);
    expect(isRegionRelevant({ type: "AIRLINE", regions: ["ASIA"] }, "EUROPE")).toBe(false);
    expect(isRegionRelevant({ type: "HOTEL", regions: ["EUROPE"] }, "EUROPE")).toBe(true);
    expect(isRegionRelevant({ type: "HOTEL", regions: ["EUROPE"] }, "AFRICA")).toBe(false);
  });

  it("airline/hotel with no regions tagged is never relevant", () => {
    expect(isRegionRelevant({ type: "AIRLINE", regions: [] }, "ASIA")).toBe(false);
    expect(isRegionRelevant({ type: "HOTEL", regions: [] }, "ASIA")).toBe(false);
  });

  it("bank-transferable and other are never themselves relevant, even with regions set", () => {
    expect(isRegionRelevant({ type: "BANK_TRANSFERABLE", regions: [] }, "ASIA")).toBe(false);
    expect(isRegionRelevant({ type: "BANK_TRANSFERABLE", regions: ["ASIA"] }, "ASIA")).toBe(false);
    expect(isRegionRelevant({ type: "OTHER", regions: ["ASIA"] }, "ASIA")).toBe(false);
  });
});
