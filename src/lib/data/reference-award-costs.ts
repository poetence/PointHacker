// Maintained reference dataset of rough award prices, loaded by `prisma/seed.ts`
// via upsert keyed on (program, region, cabin) — safe to edit and re-seed.
//
// Every number is a ballpark saver-level, one-way, per-person price for flying
// from North America to the region, in the program's own currency, priced from
// a Central US departure — `origin-adjustment.ts` scales it for the coasts, so
// a distance-based chart's Central US band goes here. NORTH_AMERICA rows are
// domestic flights. Real pricing is dynamic and varies by route, date, and
// partner — these exist so an award goal can say "roughly 90k miles" rather than
// nothing. Verify with the program before booking.
//
// Checked against 2026 sources in October 2026: a fixed chart's price is taken
// as published; a dynamic program's number is kept when it falls inside the
// sourced range and moved to that range's nearest end when it doesn't. Rows
// with no current source say "Not verified" in their notes or section comment.
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
  // Delta SkyMiles — dynamic, no chart; the low end of 2026's typical ranges. Delta One
  // usually costs 170,000+ to Europe. Premium Select isn't verified.
  { program: "Delta SkyMiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, FIRST: 30_000 } },
  { program: "Delta SkyMiles", region: "CARIBBEAN", oneWay: { ECONOMY: 17_500, FIRST: 40_000 } },
  { program: "Delta SkyMiles", region: "EUROPE", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 170_000 } },
  { program: "Delta SkyMiles", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 65_000, BUSINESS: 175_000 } },
  { program: "Delta SkyMiles", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 135_000 } },
  { program: "Delta SkyMiles", region: "OCEANIA", oneWay: { ECONOMY: 50_000, PREMIUM_ECONOMY: 80_000, BUSINESS: 280_000 } },
  { program: "Delta SkyMiles", region: "AFRICA", oneWay: { ECONOMY: 45_000, BUSINESS: 200_000 }, notes: "Not verified: no current source; business extrapolated from Europe and Asia" },

  // United MileagePlus — dynamic, no chart; saver baselines. Caribbean not verified.
  { program: "United MileagePlus", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "United MileagePlus", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 45_000, BUSINESS: 80_000 } },
  { program: "United MileagePlus", region: "ASIA", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 80_000 } },
  { program: "United MileagePlus", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "United MileagePlus", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "United MileagePlus", region: "OCEANIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 65_000, BUSINESS: 80_000 } },
  { program: "United MileagePlus", region: "AFRICA", oneWay: { ECONOMY: 40_000, BUSINESS: 80_000 }, notes: "Not verified: no current source" },
  { program: "United MileagePlus", region: "MIDDLE_EAST", oneWay: { ECONOMY: 42_500, BUSINESS: 77_000 } },

  // American AAdvantage — fixed MileSAAver chart.
  { program: "American AAdvantage", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "American AAdvantage", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "American AAdvantage", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 57_500 } },
  { program: "American AAdvantage", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 57_500, FIRST: 85_000 } },
  { program: "American AAdvantage", region: "ASIA", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 50_000, BUSINESS: 60_000, FIRST: 80_000 }, notes: "JAL and Cathay partner awards" },
  { program: "American AAdvantage", region: "OCEANIA", oneWay: { ECONOMY: 40_000, BUSINESS: 75_000 }, notes: "Qantas partner awards" },
  { program: "American AAdvantage", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 70_000 }, notes: "Qatar partner awards" },

  // Southwest Rapid Rewards — revenue-based (points track the cash fare), economy only;
  // a typical fare, not a chart price.
  { program: "Southwest Rapid Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000 } },
  { program: "Southwest Rapid Rewards", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000 } },

  // Air France-KLM Flying Blue — dynamic; Europe "from" 25,000 / 40,000 / 60,000 since 2025.
  // North America not verified.
  { program: "Air France-KLM Flying Blue", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 30_000 } },
  { program: "Air France-KLM Flying Blue", region: "EUROPE", oneWay: { ECONOMY: 25_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 60_000 } },
  { program: "Air France-KLM Flying Blue", region: "AFRICA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 85_000 } },
  { program: "Air France-KLM Flying Blue", region: "ASIA", oneWay: { ECONOMY: 40_000, PREMIUM_ECONOMY: 65_000, BUSINESS: 80_000 } },
  { program: "Air France-KLM Flying Blue", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 40_000 }, notes: "Delta partner awards" },
  { program: "Air France-KLM Flying Blue", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Air France-KLM Flying Blue", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 70_000 } },

  // Virgin Atlantic Flying Club — its own metal to the UK, plus Delta and ANA
  // partner awards (ANA business/first to Japan is the headline sweet spot).
  // North America and Caribbean not verified.
  { program: "Virgin Atlantic Flying Club", region: "NORTH_AMERICA", oneWay: { ECONOMY: 7_500, FIRST: 25_000 }, notes: "Delta partner awards" },
  { program: "Virgin Atlantic Flying Club", region: "CARIBBEAN", oneWay: { ECONOMY: 12_500, BUSINESS: 30_000 }, notes: "Delta partner awards" },
  { program: "Virgin Atlantic Flying Club", region: "EUROPE", oneWay: { ECONOMY: 22_500, PREMIUM_ECONOMY: 25_000, BUSINESS: 50_000 }, notes: "Delta partner awards; premium economy not verified" },
  { program: "Virgin Atlantic Flying Club", region: "ASIA", oneWay: { ECONOMY: 30_000, BUSINESS: 55_000, FIRST: 85_000 }, notes: "ANA partner awards; West Coast is ~52,500 in business, the East Coast more" },

  // ANA Mileage Club — one way on ANA's own flights since June 2025; partner awards
  // were round trip only, so those rows are half the round-trip price.
  { program: "ANA Mileage Club", region: "ASIA", oneWay: { ECONOMY: 25_000, PREMIUM_ECONOMY: 36_000, BUSINESS: 52_500, FIRST: 85_000 }, notes: "ANA's own flights, regular season, one way (bookable since June 2025)" },
  { program: "ANA Mileage Club", region: "EUROPE", oneWay: { ECONOMY: 27_500, BUSINESS: 50_000, FIRST: 82_500 }, notes: "Star Alliance partner awards at half the round-trip price; ANA's May 2026 one-way partner chart not verified" },
  { program: "ANA Mileage Club", region: "OCEANIA", oneWay: { ECONOMY: 37_500, BUSINESS: 72_500 }, notes: "Star Alliance partner awards at half the round-trip price; ANA's May 2026 one-way partner chart not verified" },

  // Air Canada Aeroplan — distance-based chart, as raised on June 1, 2026.
  { program: "Air Canada Aeroplan", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "Air Canada Aeroplan", region: "CARIBBEAN", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 }, notes: "Priced as within North America" },
  { program: "Air Canada Aeroplan", region: "EUROPE", oneWay: { ECONOMY: 37_500, PREMIUM_ECONOMY: 55_000, BUSINESS: 67_500 }, notes: "Between the 0–4,000 and 4,001–6,000 mile bands; East Coast trips usually price in the lower one" },
  { program: "Air Canada Aeroplan", region: "ASIA", oneWay: { ECONOMY: 50_000, PREMIUM_ECONOMY: 60_000, BUSINESS: 85_000, FIRST: 120_000 }, notes: "5,001–7,500 mile band (Japan/Korea)" },
  { program: "Air Canada Aeroplan", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 35_000, BUSINESS: 55_000 } },
  { program: "Air Canada Aeroplan", region: "OCEANIA", oneWay: { ECONOMY: 65_000, PREMIUM_ECONOMY: 85_000, BUSINESS: 102_500 }, notes: "7,501–11,000 mile band" },
  { program: "Air Canada Aeroplan", region: "MIDDLE_EAST", oneWay: { ECONOMY: 60_000, BUSINESS: 90_000 }, notes: "6,001–8,000 mile band" },
  { program: "Air Canada Aeroplan", region: "AFRICA", oneWay: { ECONOMY: 60_000, BUSINESS: 90_000 }, notes: "6,001–8,000 mile band; North Africa is cheaper, southern Africa dearer" },

  // British Airways Avios — BA no longer publishes a chart; Europe sits inside 2026's
  // off-peak ranges. The partner rows (American, Qatar, JAL) aren't verified.
  { program: "British Airways Avios", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 }, notes: "AA partner awards" },
  { program: "British Airways Avios", region: "EUROPE", oneWay: { ECONOMY: 26_000, PREMIUM_ECONOMY: 52_000, BUSINESS: 77_500, FIRST: 100_000 } },
  { program: "British Airways Avios", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 100_000 }, notes: "Qatar partner awards" },
  { program: "British Airways Avios", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 25_000 }, notes: "American and Alaska partner awards; short hops are cheapest" },
  { program: "British Airways Avios", region: "ASIA", oneWay: { ECONOMY: 35_000, BUSINESS: 90_000 }, notes: "JAL partner awards" },

  // Avianca LifeMiles — unpublished region chart; business rose in 2025. Economy and
  // North America/Caribbean not verified.
  { program: "Avianca LifeMiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_500, BUSINESS: 25_000 } },
  { program: "Avianca LifeMiles", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 30_000 } },
  { program: "Avianca LifeMiles", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Avianca LifeMiles", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 80_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "ASIA", oneWay: { ECONOMY: 40_000, BUSINESS: 90_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "MIDDLE_EAST", oneWay: { ECONOMY: 40_000, BUSINESS: 78_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "AFRICA", oneWay: { ECONOMY: 45_000, BUSINESS: 78_000 }, notes: "Star Alliance partner awards" },
  { program: "Avianca LifeMiles", region: "OCEANIA", oneWay: { ECONOMY: 45_000, BUSINESS: 90_000 }, notes: "Star Alliance partner awards" },

  // JetBlue TrueBlue — revenue-based; Mint is the business product.
  { program: "JetBlue TrueBlue", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 40_000 }, notes: "Business = Mint" },
  { program: "JetBlue TrueBlue", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000 } },
  { program: "JetBlue TrueBlue", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 110_000 }, notes: "Business = Mint; revenue-based, so it tracks the cash fare" },

  // Emirates Skywards — Saver; only the Middle East row (New York–Dubai, May 2026) is
  // verified.
  { program: "Emirates Skywards", region: "MIDDLE_EAST", oneWay: { ECONOMY: 30_000, BUSINESS: 87_000, FIRST: 188_000 }, notes: "Saver, New York to Dubai" },
  { program: "Emirates Skywards", region: "ASIA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000, FIRST: 165_000 } },
  { program: "Emirates Skywards", region: "AFRICA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000 } },
  { program: "Emirates Skywards", region: "OCEANIA", oneWay: { ECONOMY: 65_000, BUSINESS: 125_000, FIRST: 195_000 } },
  { program: "Emirates Skywards", region: "EUROPE", oneWay: { ECONOMY: 35_000, BUSINESS: 72_500 }, notes: "New York to Milan and Athens" },

  // Atmos Rewards — Alaska/Hawaiian's own flights plus oneworld partner charts. North
  // America, Caribbean and Europe not verified.
  { program: "Atmos Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000, BUSINESS: 22_500 }, notes: "Business = Alaska first class" },
  { program: "Atmos Rewards", region: "CARIBBEAN", oneWay: { ECONOMY: 15_000, BUSINESS: 35_000 }, notes: "American partner awards" },
  { program: "Atmos Rewards", region: "ASIA", oneWay: { ECONOMY: 35_000, BUSINESS: 60_000, FIRST: 70_000 }, notes: "JAL and Cathay partner awards" },
  { program: "Atmos Rewards", region: "OCEANIA", oneWay: { ECONOMY: 40_000, BUSINESS: 55_000 }, notes: "Qantas and Fiji partner awards" },
  { program: "Atmos Rewards", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 60_000 } },
  { program: "Atmos Rewards", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 70_000 }, notes: "Qatar partner awards; saver space is scarce" },

  // Singapore KrisFlyer — saver awards on Singapore's own flights (after the Nov 2025 +5%);
  // Star Alliance partners otherwise. Oceania and North America not verified.
  { program: "Singapore KrisFlyer", region: "ASIA", oneWay: { ECONOMY: 45_000, PREMIUM_ECONOMY: 82_000, BUSINESS: 115_000, FIRST: 155_000 }, notes: "Saver, US to Singapore" },
  { program: "Singapore KrisFlyer", region: "OCEANIA", oneWay: { ECONOMY: 60_000, BUSINESS: 115_000 } },
  { program: "Singapore KrisFlyer", region: "EUROPE", oneWay: { ECONOMY: 27_500, PREMIUM_ECONOMY: 57_000, BUSINESS: 89_000, FIRST: 106_500 }, notes: "Saver, New York to Frankfurt" },
  { program: "Singapore KrisFlyer", region: "NORTH_AMERICA", oneWay: { ECONOMY: 13_000, BUSINESS: 26_000 }, notes: "United partner awards" },

  // Cathay Pacific Asia Miles — distance-based (May 2026 chart); Cathay's own flights via Hong
  // Kong. The oneworld partner rows (North America, Europe) aren't verified.
  { program: "Cathay Pacific Asia Miles", region: "ASIA", oneWay: { ECONOMY: 33_000, PREMIUM_ECONOMY: 62_500, BUSINESS: 105_000, FIRST: 142_500 }, notes: "Between the 5,001–7,500 (West Coast) and 7,501+ mile bands" },
  { program: "Cathay Pacific Asia Miles", region: "OCEANIA", oneWay: { ECONOMY: 38_000, BUSINESS: 119_000 }, notes: "7,501+ mile band via Hong Kong" },
  { program: "Cathay Pacific Asia Miles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 10_000, BUSINESS: 20_000 }, notes: "American and Alaska partner awards" },
  { program: "Cathay Pacific Asia Miles", region: "EUROPE", oneWay: { ECONOMY: 27_000, BUSINESS: 70_000 }, notes: "oneworld partner awards" },

  // Japan Airlines Mileage Bank — June 2025 chart. North America not verified.
  { program: "Japan Airlines Mileage Bank", region: "ASIA", oneWay: { ECONOMY: 27_000, PREMIUM_ECONOMY: 40_000, BUSINESS: 55_000, FIRST: 110_000 }, notes: "JAL's own flights, saver" },
  { program: "Japan Airlines Mileage Bank", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 25_000 }, notes: "American and Alaska partner awards" },

  // EVA Infinity MileageLands — EVA's own flights to Taipei.
  { program: "EVA Infinity MileageLands", region: "ASIA", oneWay: { ECONOMY: 35_000, PREMIUM_ECONOMY: 55_000, BUSINESS: 80_000 } },

  // Thai Royal Orchid Plus — Star Alliance partner chart. Not verified: no current source.
  { program: "Thai Royal Orchid Plus", region: "ASIA", oneWay: { ECONOMY: 40_000, BUSINESS: 80_000 } },

  // Qantas Frequent Flyer — Classic Reward zones by distance.
  { program: "Qantas Frequent Flyer", region: "OCEANIA", oneWay: { ECONOMY: 48_000, PREMIUM_ECONOMY: 82_000, BUSINESS: 108_000, FIRST: 163_000 }, notes: "Economy verified (Los Angeles–Sydney); premium cabins rose up to 20% in Aug 2025 and aren't verified" },
  { program: "Qantas Frequent Flyer", region: "ASIA", oneWay: { ECONOMY: 45_000, BUSINESS: 90_000 }, notes: "JAL partner awards" },
  { program: "Qantas Frequent Flyer", region: "NORTH_AMERICA", oneWay: { ECONOMY: 12_000, BUSINESS: 25_000 }, notes: "American partner awards" },

  // Qatar Airways Privilege Club — Avios, via Doha; off-peak. Asia and Africa not verified.
  { program: "Qatar Airways Privilege Club", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 70_000 }, notes: "Qsuites" },
  { program: "Qatar Airways Privilege Club", region: "ASIA", oneWay: { ECONOMY: 45_000, BUSINESS: 100_000 } },
  { program: "Qatar Airways Privilege Club", region: "AFRICA", oneWay: { ECONOMY: 42_000, BUSINESS: 90_000 } },

  // Etihad Guest — via Abu Dhabi. 2026 sources conflict (44,000–60,000 economy,
  // 72,000–120,000 business to Abu Dhabi); these sit between them.
  { program: "Etihad Guest", region: "MIDDLE_EAST", oneWay: { ECONOMY: 44_000, BUSINESS: 88_000 } },
  { program: "Etihad Guest", region: "ASIA", oneWay: { ECONOMY: 55_000, BUSINESS: 105_000 } },

  // Turkish Miles&Smiles — Turkish's own flights via Istanbul, plus Star Alliance partners.
  { program: "Turkish Miles&Smiles", region: "EUROPE", oneWay: { ECONOMY: 30_000, BUSINESS: 65_000 }, notes: "US to Istanbul; economy not verified" },
  { program: "Turkish Miles&Smiles", region: "MIDDLE_EAST", oneWay: { ECONOMY: 35_000, BUSINESS: 65_000 }, notes: "Not verified; business raised to at least the Istanbul price" },
  { program: "Turkish Miles&Smiles", region: "ASIA", oneWay: { ECONOMY: 37_500, BUSINESS: 65_000 }, notes: "Not verified; business raised to at least the Istanbul price" },
  { program: "Turkish Miles&Smiles", region: "AFRICA", oneWay: { ECONOMY: 40_000, BUSINESS: 65_000 } },
  { program: "Turkish Miles&Smiles", region: "NORTH_AMERICA", oneWay: { ECONOMY: 15_000, BUSINESS: 22_500 }, notes: "United partner awards (raised 50% in Dec 2025)" },

  // Avios programs other than British Airways — off-peak.
  { program: "Iberia Club", region: "EUROPE", oneWay: { ECONOMY: 20_000, PREMIUM_ECONOMY: 36_750, BUSINESS: 50_500 }, notes: "Off-peak from Chicago/Dallas/Miami; 40,500 business from the East Coast" },
  { program: "Aer Lingus AerClub", region: "EUROPE", oneWay: { ECONOMY: 13_000, BUSINESS: 50_000 }, notes: "Off-peak to Dublin" },
  { program: "Finnair Plus", region: "EUROPE", oneWay: { ECONOMY: 30_000, PREMIUM_ECONOMY: 43_500, BUSINESS: 62_500 }, notes: "Finnair's published North America price" },

  // TAP Miles&Go — TAP's own flights via Lisbon.
  { program: "TAP Miles&Go", region: "EUROPE", oneWay: { ECONOMY: 29_000, BUSINESS: 60_000 }, notes: "Off-peak, New York to Lisbon" },

  // Aeromexico Rewards — dynamic, and its points are worth less, which the 1:1.6 Amex ratio offsets.
  // Inside 2026's ranges for Mexico and Europe; South America not verified.
  { program: "Aeromexico Rewards", region: "NORTH_AMERICA", oneWay: { ECONOMY: 15_000, BUSINESS: 40_000 }, notes: "Mexico" },
  { program: "Aeromexico Rewards", region: "SOUTH_AMERICA", oneWay: { ECONOMY: 35_000, BUSINESS: 80_000 } },
  { program: "Aeromexico Rewards", region: "EUROPE", oneWay: { ECONOMY: 50_000, BUSINESS: 120_000 } },
];
