import { describe, expect, it } from "vitest";
import { describeGoal, describeGoalUnit } from "./cabins";

const base = {
  cabin: "BUSINESS" as const,
  travelers: 2,
  roundTrip: true,
  hotelTier: "UPSCALE" as const,
  nights: 4,
  rooms: 1,
  originState: null,
  targetMonth: null,
};

describe("describeGoal", () => {
  it("describes a flight with counted travelers, trip type, origin and month", () => {
    expect(
      describeGoal({ ...base, kind: "FLIGHT", originState: "CA", targetMonth: new Date("2027-04-01T00:00:00Z") })
    ).toBe("Business · 2 travelers · round trip · from California · Apr 2027");
    expect(describeGoal({ ...base, kind: "FLIGHT", travelers: 1, roundTrip: false })).toBe(
      "Business · 1 traveler · one way"
    );
  });

  it("describes a hotel stay with counted nights and rooms", () => {
    expect(describeGoal({ ...base, kind: "HOTEL" })).toBe("Upscale hotel · 4 nights · 1 room");
    expect(describeGoal({ ...base, kind: "HOTEL", nights: 1, rooms: 2 })).toBe("Upscale hotel · 1 night · 2 rooms");
  });

  it("ignores an origin that isn't a US state code", () => {
    expect(describeGoal({ ...base, kind: "FLIGHT", originState: "ZZ" })).toBe("Business · 2 travelers · round trip");
  });
});

describe("describeGoalUnit", () => {
  it("names the cabin or the hotel tier with its article", () => {
    expect(describeGoalUnit({ ...base, kind: "FLIGHT" })).toBe("business");
    expect(describeGoalUnit({ ...base, kind: "HOTEL" })).toBe("an upscale hotel");
    expect(describeGoalUnit({ ...base, kind: "HOTEL", hotelTier: "LUXURY" })).toBe("a luxury hotel");
  });
});
