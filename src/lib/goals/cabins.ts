import { US_STATES, isUsState } from "./origin-adjustment";

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
  originState: string | null;
  targetMonth: Date | null;
};

/** "1 night", "2 nights" — every noun counted here takes a plain -s. */
function countOf(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

/** "Business · 2 travelers · round trip · Apr 2027" or "Upscale hotel · 4 nights · 1 room · Apr 2027" */
export function describeGoal(goal: DescribableGoal): string {
  const parts =
    goal.kind === "FLIGHT"
      ? [
          CABIN_LABELS[goal.cabin],
          countOf(goal.travelers, "traveler"),
          goal.roundTrip ? "round trip" : "one way",
          ...(goal.originState && isUsState(goal.originState) ? [`from ${US_STATES[goal.originState]}`] : []),
        ]
      : [
          `${HOTEL_TIER_LABELS[goal.hotelTier]} hotel`,
          countOf(goal.nights, "night"),
          countOf(goal.rooms, "room"),
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

/**
 * A name for each goal that tells it apart from the user's other goals: the
 * label alone when it's unique, plus the cabin or hotel tier when two share a
 * label ("Tokyo (Business)"), and the whole description if that still clashes.
 */
export function goalNames<G extends DescribableGoal & { id: string; label: string }>(
  goals: G[]
): Map<string, string> {
  const shortName = (goal: G) =>
    `${goal.label} (${goal.kind === "FLIGHT" ? CABIN_LABELS[goal.cabin] : `${HOTEL_TIER_LABELS[goal.hotelTier]} hotel`})`;
  const clashes = (name: (goal: G) => string, goal: G) =>
    goals.some((other) => other.id !== goal.id && name(other) === name(goal));

  return new Map(
    goals.map((goal) => {
      if (!clashes((g) => g.label, goal)) return [goal.id, goal.label];
      if (!clashes(shortName, goal)) return [goal.id, shortName(goal)];
      return [goal.id, `${goal.label} (${describeGoal(goal)})`];
    })
  );
}
