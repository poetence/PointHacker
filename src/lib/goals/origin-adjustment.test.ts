import { describe, expect, it } from "vitest";
import {
  ALL_US_STATES,
  adjustForOrigin,
  originMultiplier,
  originZoneForState,
} from "./origin-adjustment";

describe("originZoneForState", () => {
  it("buckets states by coast", () => {
    expect(originZoneForState("CA")).toBe("WEST");
    expect(originZoneForState("HI")).toBe("WEST");
    expect(originZoneForState("TX")).toBe("CENTRAL");
    expect(originZoneForState("IL")).toBe("CENTRAL");
    expect(originZoneForState("NY")).toBe("EAST");
    expect(originZoneForState("FL")).toBe("EAST");
  });

  it("maps every state to a zone", () => {
    for (const state of ALL_US_STATES) {
      expect(["WEST", "CENTRAL", "EAST"]).toContain(originZoneForState(state));
    }
  });
});

describe("adjustForOrigin", () => {
  it("makes Asia cheaper from the West and Europe cheaper from the East", () => {
    expect(originMultiplier("ASIA", "WEST")).toBeLessThan(1);
    expect(originMultiplier("ASIA", "EAST")).toBeGreaterThan(1);
    expect(originMultiplier("EUROPE", "EAST")).toBeLessThan(1);
    expect(originMultiplier("EUROPE", "WEST")).toBeGreaterThan(1);
  });

  it("rounds to the nearest 500", () => {
    expect(adjustForOrigin(47_500, "ASIA", "WEST")).toBe(43_000); // 42,750 -> 43,000
    expect(adjustForOrigin(47_500, "ASIA", "EAST")).toBe(52_500); // 52,250 -> 52,500
    expect(adjustForOrigin(30_000, "EUROPE", "EAST")).toBe(27_000); // exact
  });

  it("leaves domestic, central, and unknown-origin prices alone", () => {
    expect(adjustForOrigin(12_500, "NORTH_AMERICA", "WEST")).toBe(12_500);
    expect(adjustForOrigin(47_500, "ASIA", "CENTRAL")).toBe(47_500);
    expect(adjustForOrigin(47_500, "ASIA", null)).toBe(47_500);
    expect(adjustForOrigin(47_500, "MARS", "WEST")).toBe(47_500);
  });
});
