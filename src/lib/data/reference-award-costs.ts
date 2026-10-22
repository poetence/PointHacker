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
  { program: "Delta SkyMiles", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 65_000, BUSINESS: 95_000 } },
  { program: "Delta SkyMiles", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 75_000 } },
  { program: "Delta SkyMiles", region: "OCEANIA", oneWay: { ECONOMY: 50_000, PREMIUM_ECONOMY: 80_000, BUSINESS: 110_000 } },
  { program: "Delta SkyMiles", region: "AFRICA", oneWay: { ECONOMY: 45_000, BUSINESS: 105_000 } },

  // United MileagePlus
  { program: "United MileagePlus", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "United MileagePlus", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 45_000, BUSINESS: 70_000 } },
  { program: "United MileagePlus", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 88_000 } },
  { program: "United MileagePlus", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 70_000 } },
  { program: "United MileagePlus", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "United MileagePlus", region: "OCEANIA", oneWay: { ECONOMY: 45_000, PREMIUM_ECONOMY: 65_000, BUSINESS: 88_000 } },
  { program: "United MileagePlus", region: "AFRICA", oneWay: { ECONOMY: 40_000, BUSINESS: 88_000 } },
  { program: "United MileagePlus", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 88_000 } },

  // American AAdvantage
  { program: "American AAdvantage", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "American AAdvantage", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "American AAdvantage", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 57_500 } },
  { program: "American AAdvantage", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 57_500, FIRST: 85_000 } },
  { program: "American AAdvantage", region: "ASIA", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 50_000, BUSINESS: 60_000, FIRST: 80_000 }, notes: "JAL and Cathay partner awards" },
  { program: "American AAdvantage", region: "OCEANIA", oneWay: { ECONOMY: 40_000, BUSINESS: 80_000 }, notes: "Qantas partner awards" },
  { program: "American AAdvantage", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 70_000 }, notes: "Qatar partner awards" },

  // Southwest Rapid Rewards — revenue-based, economy only.
  { program: "Southwest Rapid Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000 } },
  { program: "Southwest Rapid Rewards", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000 } },

  // Air France-KLM Flying Blue
  { program: "Air France-KLM Flying Blue", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 30_000 } },
  { program: "Air France-KLM Flying Blue", region: "EUROPE", oneWay: { ECONOMY: 25_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 55_000 } },
  { program: "Air France-KLM Flying Blue", region: "AFRICA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 85_000 } },
  { program: "Air France-KLM Flying Blue", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 65_000, BUSINESS: 80_000 } },
  { program: "Air France-KLM Flying Blue", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 }, notes: "Delta partner awards" },
  { program: "Air France-KLM Flying Blue", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Air France-KLM Flying Blue", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 70_000 } },

  // Virgin Atlantic Flying Club — its own metal to the UK, plus Delta and ANA
  // partner awards (ANA business/first to Japan is the headline sweet spot).
  { program: "Virgin Atlantic Flying Club", region: "NORTH_AMERICA", oneWay: { ECONOMY: 7_500, FIRST: 25_000 }, notes: "Delta partner awards" },
  { program: "Virgin Atlantic Flying Club", region: "CARIBBEAN", oneWay: { ECONOMY: 12_500, BUSINESS: 30_000 }, notes: "Delta partner awards" },
  { program: "Virgin Atlantic Flying Club", region: "EUROPE", oneWay: { ECONOMY: 15_000, PREMIUM_ECONOMY: 25_000, BUSINESS: 47_500 } },
  { program: "Virgin Atlantic Flying Club", region: "ASIA", oneWay: { ECONOMY: 30_000, BUSINESS: 47_500, FIRST: 72_500 }, notes: "ANA partner awards, West Coast origin; East Coast is ~15% more" },

  // ANA Mileage Club — round-trip only in practice; these are half the RT price.
  { program: "ANA Mileage Club", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 50_000, BUSINESS: 62_500, FIRST: 112_500 }, notes: "Round trip required; shown as half the round-trip price" },
  { program: "ANA Mileage Club", region: "EUROPE", oneWay: { ECONOMY: 27_500, BUSINESS: 47_500, FIRST: 82_500 }, notes: "Star Alliance partner awards; round trip required, shown as half" },
  { program: "ANA Mileage Club", region: "OCEANIA", oneWay: { ECONOMY: 37_500, BUSINESS: 65_000 }, notes: "Star Alliance partner awards; round trip required, shown as half" },

  // Air Canada Aeroplan
  { program: "Air Canada Aeroplan", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "Air Canada Aeroplan", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 } },
  { program: "Air Canada Aeroplan", region: "EUROPE", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 45_000, BUSINESS: 60_000 } },
  { program: "Air Canada Aeroplan", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 55_000, BUSINESS: 75_000 } },
  { program: "Air Canada Aeroplan", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Air Canada Aeroplan", region: "OCEANIA", oneWay: { ECONOMY: 55_000, PREMIUM_ECONOMY: 70_000, BUSINESS: 87_500 } },
  { program: "Air Canada Aeroplan", region: "MIDDLE_EAST", oneWay: { ECONOMY: 45_000, BUSINESS: 75_000 } },
  { program: "Air Canada Aeroplan", region: "AFRICA", oneWay: { ECONOMY: 50_000, BUSINESS: 85_000 } },

  // British Airways Avios — distance-based; off-peak from the US East Coast.
  { program: "British Airways Avios", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 }, notes: "AA partner awards" },
  { program: "British Airways Avios", region: "EUROPE", oneWay: { ECONOMY: 26_000, PREMIUM_ECONOMY: 52_000, BUSINESS: 77_500, FIRST: 100_000 } },
  { program: "British Airways Avios", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 100_000 }, notes: "Qatar partner awards" },
  { program: "British Airways Avios", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 25_000 }, notes: "American and Alaska partner awards; short hops are cheapest" },
  { program: "British Airways Avios", region: "ASIA", oneWay: { ECONOMY: 35_000, BUSINESS: 90_000 }, notes: "JAL partner awards" },

  // Avianca LifeMiles
  { program: "Avianca LifeMiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "Avianca LifeMiles", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "Avianca LifeMiles", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Avianca LifeMiles", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 63_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "ASIA", oneWay: { ECONOMY: 40_000, BUSINESS: 75_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 78_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "AFRICA", oneWay: { ECONOMY: 45_000, BUSINESS: 78_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "OCEANIA", oneWay: { ECONOMY: 45_000, BUSINESS: 80_000 }, notes: "Star Alliance partner awards" },

  // JetBlue TrueBlue — revenue-based; Mint is the business product.
  { program: "JetBlue TrueBlue", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 40_000 }, notes: "Business = Mint" },
  { program: "JetBlue TrueBlue", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000 } },
  { program: "JetBlue TrueBlue", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 110_000 }, notes: "Business = Mint; revenue-based, so it tracks the cash fare" },

  // Emirates Skywards
  { program: "Emirates Skywards", region: "MIDDLE_EAST", oneWay: { ECONOMY: 45_000, BUSINESS: 85_000, FIRST: 130_000 } },
  { program: "Emirates Skywards", region: "ASIA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000, FIRST: 165_000 } },
  { program: "Emirates Skywards", region: "AFRICA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000 } },
  { program: "Emirates Skywards", region: "OCEANIA", oneWay: { ECONOMY: 65_000, BUSINESS: 125_000, FIRST: 195_000 } },
  { program: "Emirates Skywards", region: "EUROPE", oneWay: { ECONOMY: 35_000, BUSINESS: 72_500 }, notes: "New York to Milan and Athens" },

  // Atmos Rewards — Alaska/Hawaiian's own flights plus oneworld partner charts.
  { program: "Atmos Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000, BUSINESS: 22_500 }, notes: "Business = Alaska first class" },
  { program: "Atmos Rewards", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 }, notes: "American partner awards" },
  { program: "Atmos Rewards", region: "ASIA", oneWay: { ECONOMY: 35_000, BUSINESS: 60_000, FIRST: 70_000 }, notes: "JAL and Cathay partner awards" },
  { program: "Atmos Rewards", region: "OCEANIA", oneWay: { ECONOMY: 40_000, BUSINESS: 60_000 }, notes: "Qantas and Fiji partner awards" },
  { program: "Atmos Rewards", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Atmos Rewards", region: "MIDDLE_EAST", oneWay: { ECONOMY: 37_500, BUSINESS: 75_000 }, notes: "Qatar partner awards" },

  // Singapore KrisFlyer — saver awards on Singapore's own flights; Star Alliance partners otherwise.
  { program: "Singapore KrisFlyer", region: "ASIA", oneWay: { ECONOMY: 47_500, PREMIUM_ECONOMY: 62_500, BUSINESS: 92_000, FIRST: 118_000 } },
  { program: "Singapore KrisFlyer", region: "OCEANIA", oneWay: { ECONOMY: 60_000, BUSINESS: 115_000 } },
  { program: "Singapore KrisFlyer", region: "EUROPE", oneWay: { ECONOMY: 32_000, PREMIUM_ECONOMY: 48_000, BUSINESS: 81_000, FIRST: 105_000 }, notes: "New York to Frankfurt" },
  { program: "Singapore KrisFlyer", region: "NORTH_AMERICA", oneWay: { ECONOMY: 13_000, BUSINESS: 26_000 }, notes: "United partner awards" },

  // Cathay Pacific Asia Miles — distance-based; Cathay's own flights via Hong Kong.
  { program: "Cathay Pacific Asia Miles", region: "ASIA", oneWay: { ECONOMY: 33_000, PREMIUM_ECONOMY: 50_000, BUSINESS: 85_000, FIRST: 125_000 } },
  { program: "Cathay Pacific Asia Miles", region: "OCEANIA", oneWay: { ECONOMY: 45_000, BUSINESS: 110_000 } },
  { program: "Cathay Pacific Asia Miles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000, BUSINESS: 20_000 }, notes: "American and Alaska partner awards" },
  { program: "Cathay Pacific Asia Miles", region: "EUROPE", oneWay: { ECONOMY: 27_000, BUSINESS: 70_000 }, notes: "oneworld partner awards" },

  // Japan Airlines Mileage Bank
  { program: "Japan Airlines Mileage Bank", region: "ASIA", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 45_000, BUSINESS: 60_000, FIRST: 80_000 } },
  { program: "Japan Airlines Mileage Bank", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 25_000 }, notes: "American and Alaska partner awards" },

  // EVA Infinity MileageLands — EVA's own flights to Taipei.
  { program: "EVA Infinity MileageLands", region: "ASIA", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 50_000, BUSINESS: 75_000 } },

  // Thai Royal Orchid Plus — Star Alliance partner chart.
  { program: "Thai Royal Orchid Plus", region: "ASIA", oneWay: { ECONOMY: 40_000, BUSINESS: 80_000 } },

  // Qantas Frequent Flyer — Classic Reward zones by distance.
  { program: "Qantas Frequent Flyer", region: "OCEANIA", oneWay: { ECONOMY: 54_000, PREMIUM_ECONOMY: 82_000, BUSINESS: 108_000, FIRST: 163_000 } },
  { program: "Qantas Frequent Flyer", region: "ASIA", oneWay: { ECONOMY: 45_000, BUSINESS: 90_000 }, notes: "JAL partner awards" },
  { program: "Qantas Frequent Flyer", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 25_000 }, notes: "American partner awards" },

  // Qatar Airways Privilege Club — Avios, via Doha.
  { program: "Qatar Airways Privilege Club", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 70_000 }, notes: "Qsuites" },
  { program: "Qatar Airways Privilege Club", region: "ASIA", oneWay: { ECONOMY: 45_000, BUSINESS: 100_000 } },
  { program: "Qatar Airways Privilege Club", region: "AFRICA", oneWay: { ECONOMY: 42_000, BUSINESS: 90_000 } },

  // Etihad Guest — via Abu Dhabi.
  { program: "Etihad Guest", region: "MIDDLE_EAST", oneWay: { ECONOMY: 44_000, BUSINESS: 88_000 } },
  { program: "Etihad Guest", region: "ASIA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000 } },

  // Turkish Miles&Smiles — Turkish's own flights via Istanbul, plus Star Alliance partners.
  { program: "Turkish Miles&Smiles", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 45_000 } },
  { program: "Turkish Miles&Smiles", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 55_000 } },
  { program: "Turkish Miles&Smiles", region: "ASIA", oneWay: { ECONOMY: 37_500, BUSINESS: 60_000 } },
  { program: "Turkish Miles&Smiles", region: "AFRICA", oneWay: { ECONOMY: 40_000, BUSINESS: 65_000 } },
  { program: "Turkish Miles&Smiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000, BUSINESS: 15_000 }, notes: "United partner awards" },

  // Avios programs other than British Airways — off-peak, from the US East Coast.
  { program: "Iberia Club", region: "EUROPE", oneWay: { ECONOMY: 17_000, PREMIUM_ECONOMY: 25_500, BUSINESS: 34_000 }, notes: "Off-peak to Madrid" },
  { program: "Aer Lingus AerClub", region: "EUROPE", oneWay: { ECONOMY: 13_000, BUSINESS: 50_000 }, notes: "Off-peak to Dublin" },
  { program: "Finnair Plus", region: "EUROPE", oneWay: { ECONOMY: 25_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 60_000 } },

  // TAP Miles&Go — TAP's own flights via Lisbon.
  { program: "TAP Miles&Go", region: "EUROPE", oneWay: { ECONOMY: 25_000, BUSINESS: 55_000 } },

  // Aeromexico Rewards — dynamic, and its points are worth less, which the 1:1.6 Amex ratio offsets.
  { program: "Aeromexico Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 15_000, BUSINESS: 40_000 }, notes: "Mexico" },
  { program: "Aeromexico Rewards", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 35_000, BUSINESS: 80_000 } },
  { program: "Aeromexico Rewards", region: "EUROPE", oneWay: { ECONOMY: 50_000, BUSINESS: 120_000 } },
];
