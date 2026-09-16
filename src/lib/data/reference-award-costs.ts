// Maintained reference dataset of rough award prices, loaded by `prisma/seed.ts`
// via upsert keyed on (program, region, cabin) — safe to edit and re-seed.
//
// Every number is a ballpark saver-level, one-way, per-person price for flying
// from North America (US origin) to the region, in the program's own currency.
// NORTH_AMERICA rows are domestic flights. Real pricing is dynamic and varies
// by route, date, and partner — these exist so an award goal can say "roughly
// 90k miles" rather than nothing. Verify with the program before booking.
//
// A program only gets rows for regions it's tagged with in `reference-programs`;
// the seed throws if a row references an untagged region or unknown program.

import type { ReferenceRegion } from "./reference-programs";

export type ReferenceCabin = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export const REFERENCE_CABINS: ReferenceCabin[] = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

export type ReferenceAwardCost = {
  /** `name` of the RewardsProgram (must appear in referencePrograms). */
  program: string;
  region: ReferenceRegion;
  /** One-way, per-person points by cabin. Omit cabins the program doesn't offer there. */
  oneWay: Partial<Record<ReferenceCabin, number>>;
  notes?: string;
};

export const referenceAwardCosts: ReferenceAwardCost[] = [
  // Delta SkyMiles — dynamic pricing; these are the low end of what shows up.
  { program: "Delta SkyMiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, FIRST: 30_000 } },
  { program: "Delta SkyMiles", region: "CARIBBEAN", oneWay: { ECONOMY: 17_500, FIRST: 40_000 } },
  { program: "Delta SkyMiles", region: "EUROPE", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 90_000 } },

  // United MileagePlus
  { program: "United MileagePlus", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "United MileagePlus", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 45_000, BUSINESS: 70_000 } },
  { program: "United MileagePlus", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 88_000 } },
  { program: "United MileagePlus", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 70_000 } },

  // American AAdvantage
  { program: "American AAdvantage", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "American AAdvantage", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "American AAdvantage", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 57_500 } },
  { program: "American AAdvantage", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 57_500, FIRST: 85_000 } },

  // Southwest Rapid Rewards — revenue-based, economy only.
  { program: "Southwest Rapid Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000 } },
  { program: "Southwest Rapid Rewards", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000 } },

  // Air France-KLM Flying Blue
  { program: "Air France-KLM Flying Blue", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 30_000 } },
  { program: "Air France-KLM Flying Blue", region: "EUROPE", oneWay: { ECONOMY: 25_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 55_000 } },
  { program: "Air France-KLM Flying Blue", region: "AFRICA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 85_000 } },

  // Virgin Atlantic Flying Club — its own metal to the UK, plus Delta and ANA
  // partner awards (ANA business/first to Japan is the headline sweet spot).
  { program: "Virgin Atlantic Flying Club", region: "NORTH_AMERICA", oneWay: { ECONOMY: 7_500, FIRST: 25_000 }, notes: "Delta partner awards" },
  { program: "Virgin Atlantic Flying Club", region: "CARIBBEAN", oneWay: { ECONOMY: 12_500, BUSINESS: 30_000 }, notes: "Delta partner awards" },
  { program: "Virgin Atlantic Flying Club", region: "EUROPE", oneWay: { ECONOMY: 15_000, PREMIUM_ECONOMY: 25_000, BUSINESS: 47_500 } },
  { program: "Virgin Atlantic Flying Club", region: "ASIA", oneWay: { ECONOMY: 30_000, BUSINESS: 47_500, FIRST: 72_500 }, notes: "ANA partner awards, West Coast origin; East Coast is ~15% more" },

  // ANA Mileage Club — round-trip only in practice; these are half the RT price.
  { program: "ANA Mileage Club", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 50_000, BUSINESS: 62_500, FIRST: 112_500 }, notes: "Round trip required; shown as half the round-trip price" },

  // Air Canada Aeroplan
  { program: "Air Canada Aeroplan", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "Air Canada Aeroplan", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 } },
  { program: "Air Canada Aeroplan", region: "EUROPE", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 45_000, BUSINESS: 60_000 } },
  { program: "Air Canada Aeroplan", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 55_000, BUSINESS: 75_000 } },

  // British Airways Avios — distance-based; off-peak from the US East Coast.
  { program: "British Airways Avios", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 }, notes: "AA partner awards" },
  { program: "British Airways Avios", region: "EUROPE", oneWay: { ECONOMY: 26_000, PREMIUM_ECONOMY: 52_000, BUSINESS: 77_500, FIRST: 100_000 } },
  { program: "British Airways Avios", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 100_000 }, notes: "Qatar partner awards" },

  // Avianca LifeMiles
  { program: "Avianca LifeMiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "Avianca LifeMiles", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "Avianca LifeMiles", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },

  // JetBlue TrueBlue — revenue-based; Mint is the business product.
  { program: "JetBlue TrueBlue", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 40_000 }, notes: "Business = Mint" },
  { program: "JetBlue TrueBlue", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000 } },

  // Emirates Skywards
  { program: "Emirates Skywards", region: "MIDDLE_EAST", oneWay: { ECONOMY: 45_000, BUSINESS: 85_000, FIRST: 130_000 } },
  { program: "Emirates Skywards", region: "ASIA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000, FIRST: 165_000 } },
  { program: "Emirates Skywards", region: "AFRICA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000 } },
  { program: "Emirates Skywards", region: "OCEANIA", oneWay: { ECONOMY: 65_000, BUSINESS: 125_000, FIRST: 195_000 } },
];
