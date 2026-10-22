// Maintained reference dataset of rough hotel award prices, loaded by
// `prisma/seed.ts` via upsert keyed on (program, region, tier) — safe to edit
// and re-seed.
//
// Every number is a ballpark standard-room, per-night, per-room price in the
// program's own currency. Tiers are coarse buckets over each program's own
// categories/bands: STANDARD ≈ a solid mid-market property, UPSCALE ≈ a full-
// service city/resort hotel, LUXURY ≈ the program's top brands. Most programs
// price dynamically now, so treat these as "what a decent night costs", not a
// quote. Verify with the program before booking.
//
// A program only gets rows for regions it's tagged with in `reference-programs`;
// the seed throws if a row references an untagged region or unknown program.

import type { ReferenceRegion } from "./reference-programs";

export type ReferenceHotelTier = "STANDARD" | "UPSCALE" | "LUXURY";

export const REFERENCE_HOTEL_TIERS: ReferenceHotelTier[] = ["STANDARD", "UPSCALE", "LUXURY"];

export type ReferenceHotelAwardCost = {
  /** `name` of the RewardsProgram (must appear in referencePrograms). */
  program: string;
  region: ReferenceRegion;
  /** Per-night, per-room points by tier. Omit tiers the program doesn't really have there. */
  perNight: Partial<Record<ReferenceHotelTier, number>>;
  notes?: string;
};

export const referenceHotelAwardCosts: ReferenceHotelAwardCost[] = [
  // World of Hyatt — fixed category chart; cat 1–2 / 4–5 / 6–7 standard rates.
  { program: "World of Hyatt", region: "NORTH_AMERICA", perNight: { STANDARD: 8_000, UPSCALE: 17_000, LUXURY: 30_000 } },
  { program: "World of Hyatt", region: "EUROPE", perNight: { STANDARD: 8_000, UPSCALE: 20_000, LUXURY: 35_000 } },
  { program: "World of Hyatt", region: "ASIA", perNight: { STANDARD: 6_000, UPSCALE: 15_000, LUXURY: 30_000 } },
  { program: "World of Hyatt", region: "CARIBBEAN", perNight: { STANDARD: 12_000, UPSCALE: 25_000, LUXURY: 40_000 } },
  { program: "World of Hyatt", region: "MIDDLE_EAST", perNight: { STANDARD: 8_000, UPSCALE: 15_000, LUXURY: 25_000 } },
  { program: "World of Hyatt", region: "OCEANIA", perNight: { STANDARD: 12_000, UPSCALE: 20_000, LUXURY: 40_000 } },
  { program: "World of Hyatt", region: "SOUTH_AMERICA", perNight: { STANDARD: 8_000, UPSCALE: 15_000, LUXURY: 25_000 } },

  // Marriott Bonvoy — dynamic; typical off-peak-ish nights.
  { program: "Marriott Bonvoy", region: "NORTH_AMERICA", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 85_000 } },
  { program: "Marriott Bonvoy", region: "SOUTH_AMERICA", perNight: { STANDARD: 15_000, UPSCALE: 35_000, LUXURY: 70_000 } },
  { program: "Marriott Bonvoy", region: "EUROPE", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 90_000 } },
  { program: "Marriott Bonvoy", region: "ASIA", perNight: { STANDARD: 15_000, UPSCALE: 35_000, LUXURY: 70_000 } },
  { program: "Marriott Bonvoy", region: "AFRICA", perNight: { STANDARD: 20_000, UPSCALE: 40_000, LUXURY: 80_000 } },
  { program: "Marriott Bonvoy", region: "OCEANIA", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 85_000 } },
  { program: "Marriott Bonvoy", region: "MIDDLE_EAST", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 85_000 } },
  { program: "Marriott Bonvoy", region: "CARIBBEAN", perNight: { STANDARD: 30_000, UPSCALE: 60_000, LUXURY: 100_000 } },

  // Hilton Honors — dynamic; big numbers, 5th night free on standard awards not modeled.
  { program: "Hilton Honors", region: "NORTH_AMERICA", perNight: { STANDARD: 30_000, UPSCALE: 65_000, LUXURY: 120_000 } },
  { program: "Hilton Honors", region: "SOUTH_AMERICA", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 90_000 } },
  { program: "Hilton Honors", region: "EUROPE", perNight: { STANDARD: 30_000, UPSCALE: 60_000, LUXURY: 110_000 } },
  { program: "Hilton Honors", region: "ASIA", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 95_000 } },
  { program: "Hilton Honors", region: "AFRICA", perNight: { STANDARD: 25_000, UPSCALE: 50_000, LUXURY: 95_000 } },
  { program: "Hilton Honors", region: "OCEANIA", perNight: { STANDARD: 30_000, UPSCALE: 60_000, LUXURY: 110_000 } },
  { program: "Hilton Honors", region: "MIDDLE_EAST", perNight: { STANDARD: 25_000, UPSCALE: 55_000, LUXURY: 100_000 } },
  { program: "Hilton Honors", region: "CARIBBEAN", perNight: { STANDARD: 40_000, UPSCALE: 80_000, LUXURY: 150_000 } },

  // IHG One Rewards — dynamic; 4th night free on the co-brand card not modeled.
  { program: "IHG One Rewards", region: "NORTH_AMERICA", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 80_000 } },
  { program: "IHG One Rewards", region: "EUROPE", perNight: { STANDARD: 20_000, UPSCALE: 40_000, LUXURY: 70_000 } },
  { program: "IHG One Rewards", region: "ASIA", perNight: { STANDARD: 15_000, UPSCALE: 30_000, LUXURY: 60_000 } },
  { program: "IHG One Rewards", region: "AFRICA", perNight: { STANDARD: 20_000, UPSCALE: 40_000, LUXURY: 70_000 } },
  { program: "IHG One Rewards", region: "MIDDLE_EAST", perNight: { STANDARD: 20_000, UPSCALE: 40_000, LUXURY: 70_000 } },
  { program: "IHG One Rewards", region: "CARIBBEAN", perNight: { STANDARD: 30_000, UPSCALE: 55_000, LUXURY: 90_000 } },
  { program: "IHG One Rewards", region: "SOUTH_AMERICA", perNight: { STANDARD: 15_000, UPSCALE: 30_000, LUXURY: 60_000 } },
  { program: "IHG One Rewards", region: "OCEANIA", perNight: { STANDARD: 20_000, UPSCALE: 45_000, LUXURY: 80_000 } },

  // Choice Privileges — mostly economy/midscale; "luxury" is the Ascend/Cambria top end.
  { program: "Choice Privileges", region: "NORTH_AMERICA", perNight: { STANDARD: 10_000, UPSCALE: 20_000, LUXURY: 35_000 } },
  { program: "Choice Privileges", region: "EUROPE", perNight: { STANDARD: 12_000, UPSCALE: 25_000, LUXURY: 40_000 } },
  { program: "Choice Privileges", region: "ASIA", perNight: { STANDARD: 8_000, UPSCALE: 15_000 }, notes: "Mostly Japan" },

  // Wyndham Rewards — fixed chart: 7,500 / 15,000 / 30,000 a night.
  { program: "Wyndham Rewards", region: "NORTH_AMERICA", perNight: { STANDARD: 7_500, UPSCALE: 15_000, LUXURY: 30_000 } },
  { program: "Wyndham Rewards", region: "EUROPE", perNight: { STANDARD: 7_500, UPSCALE: 15_000, LUXURY: 30_000 } },
  { program: "Wyndham Rewards", region: "ASIA", perNight: { STANDARD: 7_500, UPSCALE: 15_000 } },
  { program: "Wyndham Rewards", region: "CARIBBEAN", perNight: { STANDARD: 15_000, UPSCALE: 30_000 }, notes: "Mostly all-inclusive resorts and Vacasa rentals" },

  // Accor Live Limitless — revenue-based, so these follow typical cash rates (~2.1¢ a point).
  { program: "Accor Live Limitless", region: "NORTH_AMERICA", perNight: { STANDARD: 7_000, UPSCALE: 13_000, LUXURY: 30_000 } },
  { program: "Accor Live Limitless", region: "EUROPE", perNight: { STANDARD: 6_000, UPSCALE: 11_000, LUXURY: 25_000 } },
  { program: "Accor Live Limitless", region: "ASIA", perNight: { STANDARD: 4_000, UPSCALE: 8_000, LUXURY: 20_000 } },
  { program: "Accor Live Limitless", region: "OCEANIA", perNight: { STANDARD: 6_000, UPSCALE: 11_000, LUXURY: 25_000 } },
  { program: "Accor Live Limitless", region: "MIDDLE_EAST", perNight: { STANDARD: 5_000, UPSCALE: 10_000, LUXURY: 22_000 } },
  { program: "Accor Live Limitless", region: "AFRICA", perNight: { STANDARD: 5_000, UPSCALE: 9_000, LUXURY: 20_000 } },
  { program: "Accor Live Limitless", region: "SOUTH_AMERICA", perNight: { STANDARD: 4_000, UPSCALE: 8_000, LUXURY: 18_000 } },

  // I Prefer Hotel Rewards — certificates toward independent upscale and luxury hotels.
  { program: "I Prefer Hotel Rewards", region: "NORTH_AMERICA", perNight: { UPSCALE: 50_000, LUXURY: 90_000 } },
  { program: "I Prefer Hotel Rewards", region: "EUROPE", perNight: { UPSCALE: 50_000, LUXURY: 90_000 } },
  { program: "I Prefer Hotel Rewards", region: "ASIA", perNight: { UPSCALE: 40_000, LUXURY: 80_000 } },
  { program: "I Prefer Hotel Rewards", region: "CARIBBEAN", perNight: { UPSCALE: 60_000, LUXURY: 110_000 } },
];
