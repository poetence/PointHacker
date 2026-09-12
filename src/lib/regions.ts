export const REGION_LABELS = {
  NORTH_AMERICA: "North America",
  SOUTH_AMERICA: "South America",
  EUROPE: "Europe",
  ASIA: "Asia",
  AFRICA: "Africa",
  OCEANIA: "Oceania",
  MIDDLE_EAST: "Middle East",
  CARIBBEAN: "Caribbean",
} as const;

export type Region = keyof typeof REGION_LABELS;

export const ALL_REGIONS = Object.keys(REGION_LABELS) as Region[];

export function isRegion(value: string): value is Region {
  return value in REGION_LABELS;
}
