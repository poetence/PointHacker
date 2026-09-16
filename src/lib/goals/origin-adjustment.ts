// Adjusts a flight award price for where in the US the trip starts. The
// reference award-cost table is priced from a generic North America origin;
// real charts and dynamic pricing both track distance, so a West Coast start
// is cheaper to Asia and pricier to Europe (and vice versa). This is a coarse
// coast-level heuristic on top of already-ballpark numbers — not a chart.
// Pure and DB-agnostic.

export type OriginZone = "WEST" | "CENTRAL" | "EAST";

export const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
} as const;

export type UsState = keyof typeof US_STATES;

export const ALL_US_STATES = Object.keys(US_STATES) as UsState[];

export function isUsState(value: string): value is UsState {
  return value in US_STATES;
}

const WEST: UsState[] = ["AK", "AZ", "CA", "CO", "HI", "ID", "MT", "NV", "NM", "OR", "UT", "WA", "WY"];
const EAST: UsState[] = [
  "CT", "DE", "DC", "FL", "GA", "ME", "MD", "MA", "NH", "NJ", "NY", "NC", "PA", "RI", "SC", "VT", "VA", "WV",
];

export function originZoneForState(state: UsState): OriginZone {
  if (WEST.includes(state)) return "WEST";
  if (EAST.includes(state)) return "EAST";
  return "CENTRAL";
}

export const ORIGIN_ZONE_LABELS: Record<OriginZone, string> = {
  WEST: "West Coast",
  CENTRAL: "Central US",
  EAST: "East Coast",
};

/** Multiplier on the reference one-way price by destination region and origin zone. */
const MULTIPLIERS: Record<string, Record<OriginZone, number>> = {
  NORTH_AMERICA: { WEST: 1, CENTRAL: 1, EAST: 1 },
  CARIBBEAN: { WEST: 1.15, CENTRAL: 1, EAST: 0.9 },
  SOUTH_AMERICA: { WEST: 1.1, CENTRAL: 1, EAST: 0.95 },
  EUROPE: { WEST: 1.15, CENTRAL: 1, EAST: 0.9 },
  AFRICA: { WEST: 1.1, CENTRAL: 1, EAST: 0.95 },
  MIDDLE_EAST: { WEST: 1.1, CENTRAL: 1, EAST: 0.95 },
  ASIA: { WEST: 0.9, CENTRAL: 1, EAST: 1.1 },
  OCEANIA: { WEST: 0.9, CENTRAL: 1, EAST: 1.1 },
};

export function originMultiplier(region: string, zone: OriginZone): number {
  return MULTIPLIERS[region]?.[zone] ?? 1;
}

/** One-way price adjusted for the origin zone, rounded to the nearest 500 so it still reads like an award price. */
export function adjustForOrigin(pointsOneWay: number, region: string, zone: OriginZone | null): number {
  if (zone === null) return pointsOneWay;
  return Math.round((pointsOneWay * originMultiplier(region, zone)) / 500) * 500;
}
