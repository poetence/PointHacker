// Maintained reference dataset for rewards programs and transfer-partner
// relationships. Loaded by `prisma/seed.ts` via upsert, keyed on program
// `name` and the (fromProgram, toProgram) pair — safe to edit and re-seed.
//
// `defaultRedemptionValueCents` / `estimatedRedemptionValueCents` are ballpark
// cents-per-point valuations for ranking purposes, not guaranteed cash-out
// rates. Ratios, minimums, and fees drift with issuer promotions — verify
// against the issuer/program before relying on a specific number.

export type ReferenceProgramType =
  | "BANK_TRANSFERABLE"
  | "AIRLINE"
  | "HOTEL"
  | "CASHBACK"
  | "OTHER";

export type ReferenceRegion =
  | "NORTH_AMERICA"
  | "SOUTH_AMERICA"
  | "EUROPE"
  | "ASIA"
  | "AFRICA"
  | "OCEANIA"
  | "MIDDLE_EAST"
  | "CARIBBEAN";

export type ReferenceProgram = {
  name: string;
  shortName?: string;
  type: ReferenceProgramType;
  /** Estimated value of one point when redeemed directly, in cents. */
  defaultRedemptionValueCents: number;
  /**
   * Coarse regions this program is strong in — only meaningful for AIRLINE/HOTEL
   * types. A heuristic for "plan a trip" filtering, not a precise award chart.
   */
  regions?: ReferenceRegion[];
  /**
   * Months of inactivity before points expire, if the program has a rolling
   * inactivity policy. Omit (or leave undefined) for programs that don't
   * expire points or have no meaningful inactivity policy — this is a
   * best-effort estimate like the redemption values above; verify against
   * the program before relying on it.
   */
  pointsExpirationMonths?: number;
  /** What the program calls its unit. Defaults to "points"; most airlines use "miles". */
  pointsUnit?: "points" | "miles";
  notes?: string;
};

export type ReferenceTransferPartner = {
  /** `name` of the source RewardsProgram (must appear in referencePrograms). */
  fromProgram: string;
  /** `name` of the destination RewardsProgram. */
  toProgram: string;
  ratioFrom: number;
  ratioTo: number;
  minimumTransfer?: number;
  transferFeeCents?: number;
  /** Estimated value of one destination point once transferred, in cents. */
  estimatedRedemptionValueCents?: number;
  notes?: string;
};

export const referencePrograms: ReferenceProgram[] = [
  // Bank transferable currencies
  {
    name: "American Express Membership Rewards",
    shortName: "Amex MR",
    type: "BANK_TRANSFERABLE",
    defaultRedemptionValueCents: 1.0,
    notes: "~1 cpp via Amex Travel 'Pay with Points'; transfer partners typically higher.",
  },
  {
    name: "Chase Ultimate Rewards",
    shortName: "Chase UR",
    type: "BANK_TRANSFERABLE",
    defaultRedemptionValueCents: 1.0,
    notes: "1 cpp cash value; up to 1.5 cpp via Chase Travel on premium cards. Transfer partners typically higher.",
  },
  {
    name: "Citi ThankYou Points",
    shortName: "Citi TYP",
    type: "BANK_TRANSFERABLE",
    defaultRedemptionValueCents: 1.0,
    notes: "1 cpp cash value; transfer partners typically higher.",
  },
  {
    name: "Capital One Miles",
    shortName: "Cap1 Miles",
    type: "BANK_TRANSFERABLE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.0,
    notes: "1 cpp against travel purchases; transfer partners typically higher.",
  },
  {
    name: "Bilt Rewards",
    shortName: "Bilt",
    type: "BANK_TRANSFERABLE",
    defaultRedemptionValueCents: 0.5,
    notes: "No standard cash-out; ~0.5 cpp via merchandise/rent day redemptions. Real value realized through transfer partners.",
  },

  // Airlines
  {
    name: "Delta SkyMiles",
    shortName: "Delta",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.2,
    regions: ["NORTH_AMERICA", "EUROPE", "CARIBBEAN"],
  },
  {
    name: "United MileagePlus",
    shortName: "United",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.3,
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "SOUTH_AMERICA"],
  },
  {
    name: "American AAdvantage",
    shortName: "AA",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 24,
    regions: ["NORTH_AMERICA", "CARIBBEAN", "SOUTH_AMERICA", "EUROPE"],
  },
  {
    name: "Southwest Rapid Rewards",
    shortName: "Southwest",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.3,
    regions: ["NORTH_AMERICA", "CARIBBEAN"],
  },
  {
    name: "Air France-KLM Flying Blue",
    shortName: "Flying Blue",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.3,
    pointsExpirationMonths: 24,
    regions: ["EUROPE", "AFRICA", "NORTH_AMERICA"],
  },
  {
    name: "Virgin Atlantic Flying Club",
    shortName: "Virgin Atlantic",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.5,
    pointsExpirationMonths: 36,
    notes: "Strong value on Delta/ANA partner awards booked through Virgin.",
    regions: ["EUROPE", "NORTH_AMERICA", "CARIBBEAN"],
  },
  {
    name: "ANA Mileage Club",
    shortName: "ANA",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.7,
    pointsExpirationMonths: 36,
    notes: "Distance-based charts; excellent value on Star Alliance business/first.",
    regions: ["ASIA"],
  },
  {
    name: "Air Canada Aeroplan",
    shortName: "Aeroplan",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.5,
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "CARIBBEAN"],
  },
  {
    name: "British Airways Avios",
    shortName: "Avios",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 24,
    notes: "Distance-based; best on short-haul partner flights.",
    regions: ["EUROPE", "MIDDLE_EAST", "CARIBBEAN"],
  },
  {
    name: "Avianca LifeMiles",
    shortName: "LifeMiles",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 12,
    regions: ["SOUTH_AMERICA", "NORTH_AMERICA", "CARIBBEAN"],
  },
  {
    name: "JetBlue TrueBlue",
    shortName: "JetBlue",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.3,
    regions: ["NORTH_AMERICA", "CARIBBEAN"],
  },
  {
    name: "Emirates Skywards",
    shortName: "Emirates",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.2,
    pointsExpirationMonths: 36,
    regions: ["MIDDLE_EAST", "ASIA", "AFRICA", "OCEANIA"],
  },

  // Hotels
  {
    name: "World of Hyatt",
    shortName: "Hyatt",
    type: "HOTEL",
    defaultRedemptionValueCents: 1.7,
    pointsExpirationMonths: 24,
    notes: "Category-based award chart; consistently the strongest hotel program value.",
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "CARIBBEAN"],
  },
  {
    name: "Marriott Bonvoy",
    shortName: "Marriott",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.8,
    pointsExpirationMonths: 24,
    regions: [
      "NORTH_AMERICA",
      "SOUTH_AMERICA",
      "EUROPE",
      "ASIA",
      "AFRICA",
      "OCEANIA",
      "MIDDLE_EAST",
      "CARIBBEAN",
    ],
  },
  {
    name: "Hilton Honors",
    shortName: "Hilton",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.5,
    notes: "Large point currency; low per-point value, high earn rates offset it.",
    regions: [
      "NORTH_AMERICA",
      "SOUTH_AMERICA",
      "EUROPE",
      "ASIA",
      "AFRICA",
      "OCEANIA",
      "MIDDLE_EAST",
      "CARIBBEAN",
    ],
  },
  {
    name: "IHG One Rewards",
    shortName: "IHG",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.6,
    pointsExpirationMonths: 12,
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "AFRICA", "MIDDLE_EAST", "CARIBBEAN"],
  },
  {
    name: "Choice Privileges",
    shortName: "Choice",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.6,
    pointsExpirationMonths: 18,
    regions: ["NORTH_AMERICA", "EUROPE"],
  },

  // Cashback (redemption value is fixed by definition)
  {
    name: "Discover Cashback Bonus",
    shortName: "Discover Cash",
    type: "CASHBACK",
    defaultRedemptionValueCents: 1.0,
  },
  {
    name: "Amex Blue Cash Reward Dollars",
    shortName: "Amex Cash",
    type: "CASHBACK",
    defaultRedemptionValueCents: 1.0,
  },
  {
    name: "Capital One Cash Back",
    shortName: "Cap1 Cash",
    type: "CASHBACK",
    defaultRedemptionValueCents: 1.0,
  },
  {
    name: "Wells Fargo Rewards",
    shortName: "WF Rewards",
    type: "CASHBACK",
    defaultRedemptionValueCents: 1.0,
  },
];

export const referenceTransferPartners: ReferenceTransferPartner[] = [
  // American Express Membership Rewards
  { fromProgram: "American Express Membership Rewards", toProgram: "Delta SkyMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "ANA Mileage Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Marriott Bonvoy", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Hilton Honors", ratioFrom: 1, ratioTo: 2 },

  // Chase Ultimate Rewards
  { fromProgram: "Chase Ultimate Rewards", toProgram: "United MileagePlus", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Southwest Rapid Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "World of Hyatt", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "IHG One Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Marriott Bonvoy", ratioFrom: 1, ratioTo: 1 },

  // Citi ThankYou Points
  { fromProgram: "Citi ThankYou Points", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Emirates Skywards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "JetBlue TrueBlue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Choice Privileges", ratioFrom: 1, ratioTo: 1 },

  // Capital One Miles
  { fromProgram: "Capital One Miles", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Emirates Skywards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },

  // Bilt Rewards
  { fromProgram: "Bilt Rewards", toProgram: "American AAdvantage", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "United MileagePlus", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "World of Hyatt", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
];
