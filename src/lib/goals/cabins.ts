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

/** "Business · 2 travelers · round trip · Apr 2027" */
export function describeGoal(goal: {
  cabin: Cabin;
  travelers: number;
  roundTrip: boolean;
  targetMonth: Date | null;
}): string {
  const parts = [
    CABIN_LABELS[goal.cabin],
    `${goal.travelers} ${goal.travelers === 1 ? "traveler" : "travelers"}`,
    goal.roundTrip ? "round trip" : "one way",
  ];
  if (goal.targetMonth) {
    parts.push(
      goal.targetMonth.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    );
  }
  return parts.join(" · ");
}
