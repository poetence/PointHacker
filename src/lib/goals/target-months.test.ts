import { describe, expect, it } from "vitest";
import { targetMonthOptions, toMonthOption, upcomingMonths } from "./target-months";

const now = new Date("2026-09-15T12:00:00Z");

describe("upcomingMonths", () => {
  it("starts at the current month and rolls over the year", () => {
    const months = upcomingMonths(now, 5);
    expect(months.map((m) => m.value)).toEqual(["2026-09", "2026-10", "2026-11", "2026-12", "2027-01"]);
    expect(months[0].label).toBe("Sep 2026");
    expect(months[4].label).toBe("Jan 2027");
  });

  it("defaults to a two-year window", () => {
    expect(upcomingMonths(now)).toHaveLength(24);
  });
});

describe("targetMonthOptions", () => {
  it("keeps an out-of-window month for an existing goal, in order", () => {
    const options = targetMonthOptions(now, "2026-03");
    expect(options[0]).toEqual(toMonthOption("2026-03"));
    expect(options).toHaveLength(25);
  });

  it("doesn't duplicate a month already in the window", () => {
    expect(targetMonthOptions(now, "2027-04")).toHaveLength(24);
    expect(targetMonthOptions(now, "")).toHaveLength(24);
  });
});
