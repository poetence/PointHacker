export const CABIN_LABELS = {
  ECONOMY: "Economy",
  PREMIUM_ECONOMY: "Premium economy",
  BUSINESS: "Business",
  FIRST: "First",
} as const;

export type Cabin = keyof typeof CABIN_LABELS;

export const ALL_CABINS = Object.keys(CABIN_LABELS) as Cabin[];

export function isCabin(value: string): value is Cabin {
  return value in CABIN_LABELS;
}

export const HOTEL_TIER_LABELS = {
  STANDARD: "Standard",
  UPSCALE: "Upscale",
  LUXURY: "Luxury",
} as const;

export type HotelTier = keyof typeof HOTEL_TIER_LABELS;

export const ALL_HOTEL_TIERS = Object.keys(HOTEL_TIER_LABELS) as HotelTier[];

export function isHotelTier(value: string): value is HotelTier {
  return value in HOTEL_TIER_LABELS;
}

export const GOAL_KIND_LABELS = {
  FLIGHT: "Flight",
  HOTEL: "Hotel stay",
} as const;

export type GoalKind = keyof typeof GOAL_KIND_LABELS;

export const ALL_GOAL_KINDS = Object.keys(GOAL_KIND_LABELS) as GoalKind[];

export function isGoalKind(value: string): value is GoalKind {
  return value in GOAL_KIND_LABELS;
}

type DescribableGoal = {
  kind: GoalKind;
  cabin: Cabin;
  travelers: number;
  roundTrip: boolean;
  hotelTier: HotelTier;
  nights: number;
  rooms: number;
  targetMonth: Date | null;
};

/** "Business · 2 travelers · round trip · Apr 2027" or "Upscale hotel · 4 nights · 1 room · Apr 2027" */
export function describeGoal(goal: DescribableGoal): string {
  const parts =
    goal.kind === "FLIGHT"
      ? [
          CABIN_LABELS[goal.cabin],
          `${goal.travelers} ${goal.travelers === 1 ? "traveler" : "travelers"}`,
          goal.roundTrip ? "round trip" : "one way",
        ]
      : [
          `${HOTEL_TIER_LABELS[goal.hotelTier]} hotel`,
          `${goal.nights} ${goal.nights === 1 ? "night" : "nights"}`,
          `${goal.rooms} ${goal.rooms === 1 ? "room" : "rooms"}`,
        ];
  if (goal.targetMonth) {
    parts.push(
      goal.targetMonth.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    );
  }
  return parts.join(" · ");
}

/** The thing being priced, for "X points for <this>" copy: "business" / "an upscale hotel". */
export function describeGoalUnit(goal: DescribableGoal): string {
  return goal.kind === "FLIGHT"
    ? CABIN_LABELS[goal.cabin].toLowerCase()
    : `${goal.hotelTier === "UPSCALE" ? "an" : "a"} ${HOTEL_TIER_LABELS[goal.hotelTier].toLowerCase()} hotel`;
}
