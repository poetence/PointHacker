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
    regions: ["NORTH_AMERICA", "EUROPE", "CARIBBEAN", "ASIA", "SOUTH_AMERICA", "OCEANIA", "AFRICA"],
  },
  {
    name: "United MileagePlus",
    shortName: "United",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.3,
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "SOUTH_AMERICA", "CARIBBEAN", "OCEANIA", "AFRICA", "MIDDLE_EAST"],
  },
  {
    name: "American AAdvantage",
    shortName: "AA",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 24,
    regions: ["NORTH_AMERICA", "CARIBBEAN", "SOUTH_AMERICA", "EUROPE", "ASIA", "OCEANIA", "MIDDLE_EAST"],
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
    regions: ["EUROPE", "AFRICA", "NORTH_AMERICA", "ASIA", "CARIBBEAN", "SOUTH_AMERICA", "MIDDLE_EAST"],
  },
  {
    name: "Virgin Atlantic Flying Club",
    shortName: "Virgin Atlantic",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.5,
    pointsExpirationMonths: 36,
    notes: "Strong value on Delta/ANA partner awards booked through Virgin.",
    regions: ["EUROPE", "NORTH_AMERICA", "CARIBBEAN", "ASIA"],
  },
  {
    name: "ANA Mileage Club",
    shortName: "ANA",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.7,
    pointsExpirationMonths: 36,
    notes: "Distance-based charts; excellent value on Star Alliance business/first.",
    regions: ["ASIA", "EUROPE", "OCEANIA"],
  },
  {
    name: "Air Canada Aeroplan",
    shortName: "Aeroplan",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.5,
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "CARIBBEAN", "SOUTH_AMERICA", "OCEANIA", "MIDDLE_EAST", "AFRICA"],
  },
  {
    name: "British Airways Avios",
    shortName: "Avios",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 24,
    notes: "Distance-based; best on short-haul partner flights.",
    regions: ["EUROPE", "MIDDLE_EAST", "CARIBBEAN", "NORTH_AMERICA", "ASIA"],
  },
  {
    name: "Avianca LifeMiles",
    shortName: "LifeMiles",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 12,
    notes: "Star Alliance awards with no fuel surcharges.",
    regions: ["SOUTH_AMERICA", "NORTH_AMERICA", "CARIBBEAN", "EUROPE", "ASIA", "MIDDLE_EAST", "AFRICA", "OCEANIA"],
  },
  {
    name: "JetBlue TrueBlue",
    shortName: "JetBlue",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.3,
    regions: ["NORTH_AMERICA", "CARIBBEAN", "EUROPE"],
  },
  {
    name: "Emirates Skywards",
    shortName: "Emirates",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.2,
    pointsExpirationMonths: 36,
    regions: ["MIDDLE_EAST", "ASIA", "AFRICA", "OCEANIA", "EUROPE"],
  },
  {
    name: "Atmos Rewards",
    shortName: "Atmos",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.4,
    notes: "Alaska and Hawaiian's merged program; strong oneworld partner awards (JAL, Cathay, Qantas, Qatar).",
    regions: ["NORTH_AMERICA", "CARIBBEAN", "ASIA", "OCEANIA", "EUROPE", "MIDDLE_EAST"],
  },
  {
    name: "Singapore KrisFlyer",
    shortName: "KrisFlyer",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 36,
    notes: "Miles expire 3 years after they're earned regardless of activity.",
    regions: ["ASIA", "OCEANIA", "EUROPE", "NORTH_AMERICA"],
  },
  {
    name: "Cathay Pacific Asia Miles",
    shortName: "Asia Miles",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.3,
    pointsExpirationMonths: 18,
    regions: ["ASIA", "OCEANIA", "NORTH_AMERICA", "EUROPE"],
  },
  {
    name: "Japan Airlines Mileage Bank",
    shortName: "JAL",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 36,
    notes: "Miles expire 3 years after they're earned regardless of activity.",
    regions: ["ASIA", "NORTH_AMERICA"],
  },
  {
    name: "EVA Infinity MileageLands",
    shortName: "EVA",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.3,
    pointsExpirationMonths: 36,
    regions: ["ASIA"],
  },
  {
    name: "Thai Royal Orchid Plus",
    shortName: "Thai ROP",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.2,
    pointsExpirationMonths: 36,
    regions: ["ASIA"],
  },
  {
    name: "Qantas Frequent Flyer",
    shortName: "Qantas",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.2,
    pointsExpirationMonths: 18,
    regions: ["OCEANIA", "ASIA", "NORTH_AMERICA"],
  },
  {
    name: "Qatar Airways Privilege Club",
    shortName: "Qatar",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 36,
    notes: "Earns Avios; Qsuites business to Doha is the headline sweet spot.",
    regions: ["MIDDLE_EAST", "ASIA", "AFRICA"],
  },
  {
    name: "Etihad Guest",
    shortName: "Etihad",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.2,
    pointsExpirationMonths: 18,
    regions: ["MIDDLE_EAST", "ASIA"],
  },
  {
    name: "Turkish Miles&Smiles",
    shortName: "Turkish",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 1.3,
    pointsExpirationMonths: 36,
    notes: "Cheap Star Alliance partner awards, including United domestic; some awards book only by phone.",
    regions: ["EUROPE", "MIDDLE_EAST", "ASIA", "AFRICA", "NORTH_AMERICA"],
  },
  {
    name: "Iberia Club",
    shortName: "Iberia",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 36,
    notes: "Earns Avios; off-peak business from the US East Coast to Madrid is the headline sweet spot.",
    regions: ["EUROPE"],
  },
  {
    name: "Aer Lingus AerClub",
    shortName: "Aer Lingus",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.4,
    pointsExpirationMonths: 36,
    notes: "Earns Avios; off-peak flights from the US East Coast to Dublin.",
    regions: ["EUROPE"],
  },
  {
    name: "Finnair Plus",
    shortName: "Finnair",
    type: "AIRLINE",
    defaultRedemptionValueCents: 1.3,
    pointsExpirationMonths: 24,
    notes: "Earns Avios.",
    regions: ["EUROPE"],
  },
  {
    name: "TAP Miles&Go",
    shortName: "TAP",
    type: "AIRLINE",
    pointsUnit: "miles",
    defaultRedemptionValueCents: 0.9,
    pointsExpirationMonths: 36,
    notes: "Carrier surcharges on TAP's own flights eat into the value.",
    regions: ["EUROPE"],
  },
  {
    name: "Aeromexico Rewards",
    shortName: "Aeromexico",
    type: "AIRLINE",
    defaultRedemptionValueCents: 0.8,
    pointsExpirationMonths: 24,
    regions: ["NORTH_AMERICA", "SOUTH_AMERICA", "EUROPE"],
  },

  // Hotels
  {
    name: "World of Hyatt",
    shortName: "Hyatt",
    type: "HOTEL",
    defaultRedemptionValueCents: 1.7,
    pointsExpirationMonths: 24,
    notes: "Category-based award chart; consistently the strongest hotel program value.",
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "CARIBBEAN", "MIDDLE_EAST", "OCEANIA", "SOUTH_AMERICA"],
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
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "AFRICA", "MIDDLE_EAST", "CARIBBEAN", "SOUTH_AMERICA", "OCEANIA"],
  },
  {
    name: "Choice Privileges",
    shortName: "Choice",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.6,
    pointsExpirationMonths: 18,
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA"],
  },
  {
    name: "Wyndham Rewards",
    shortName: "Wyndham",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.9,
    pointsExpirationMonths: 18,
    notes: "Fixed 7,500 / 15,000 / 30,000 award chart; also books Vacasa rentals.",
    regions: ["NORTH_AMERICA", "EUROPE", "CARIBBEAN", "ASIA"],
  },
  {
    name: "Accor Live Limitless",
    shortName: "Accor",
    type: "HOTEL",
    defaultRedemptionValueCents: 2.1,
    pointsExpirationMonths: 12,
    notes: "Revenue-based: 2,000 points take €40 off any stay, so a point's value is fixed — but every bank transfers at 2:1 or 3:2.",
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "OCEANIA", "MIDDLE_EAST", "AFRICA", "SOUTH_AMERICA"],
  },
  {
    name: "I Prefer Hotel Rewards",
    shortName: "I Prefer",
    type: "HOTEL",
    defaultRedemptionValueCents: 0.5,
    notes: "Preferred Hotels & Resorts; points become cash certificates toward independent upscale hotels.",
    regions: ["NORTH_AMERICA", "EUROPE", "ASIA", "CARIBBEAN"],
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

// Each bank's current partner list (checked against issuer partner pages and
// aggregator listings in October 2026). A relationship removed from this list is
// marked inactive by the seed rather than deleted, so promos logged against it
// keep their history. Wells Fargo Rewards stays CASHBACK: the catalog's only
// Wells Fargo card, Active Cash, earns cash rewards, and the transferable
// Autograph Journey card isn't in the catalog.
export const referenceTransferPartners: ReferenceTransferPartner[] = [
  // American Express Membership Rewards — 16 airlines + 3 hotels. Etihad left on Jun 30, 2026.
  { fromProgram: "American Express Membership Rewards", toProgram: "Aer Lingus AerClub", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Aeromexico Rewards", ratioFrom: 5, ratioTo: 8 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "ANA Mileage Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Cathay Pacific Asia Miles", ratioFrom: 5, ratioTo: 4 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Delta SkyMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Emirates Skywards", ratioFrom: 5, ratioTo: 4 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Iberia Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "JetBlue TrueBlue", ratioFrom: 5, ratioTo: 4 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Qantas Frequent Flyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Qatar Airways Privilege Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Singapore KrisFlyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Choice Privileges", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Hilton Honors", ratioFrom: 1, ratioTo: 2 },
  { fromProgram: "American Express Membership Rewards", toProgram: "Marriott Bonvoy", ratioFrom: 1, ratioTo: 1 },

  // Chase Ultimate Rewards — 10 airlines + 4 hotels. Freedom cards transfer only alongside a
  // Sapphire (`soloTransferShare` in reference-cards.ts), and the Sapphire Preferred moved to 4:3
  // for Hyatt on Oct 1, 2026 (a card-level override there).
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Aer Lingus AerClub", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Iberia Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "JetBlue TrueBlue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Singapore KrisFlyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Southwest Rapid Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "United MileagePlus", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "IHG One Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Marriott Bonvoy", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "World of Hyatt", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Chase Ultimate Rewards", toProgram: "Wyndham Rewards", ratioFrom: 1, ratioTo: 1 },

  // Citi ThankYou Points — full ratios on the Strata Premier; no-fee cards (Double Cash) get 70%
  // of them unless pooled with a Strata Premier (`soloTransferShare` in reference-cards.ts).
  { fromProgram: "Citi ThankYou Points", toProgram: "Aer Lingus AerClub", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "American AAdvantage", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Cathay Pacific Asia Miles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Emirates Skywards", ratioFrom: 5, ratioTo: 4 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Etihad Guest", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "EVA Infinity MileageLands", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Japan Airlines Mileage Bank", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "JetBlue TrueBlue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Qantas Frequent Flyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Qatar Airways Privilege Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Singapore KrisFlyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Thai Royal Orchid Plus", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Turkish Miles&Smiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Accor Live Limitless", ratioFrom: 2, ratioTo: 1 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Choice Privileges", ratioFrom: 2, ratioTo: 3 },
  { fromProgram: "Citi ThankYou Points", toProgram: "I Prefer Hotel Rewards", ratioFrom: 1, ratioTo: 2 },
  { fromProgram: "Citi ThankYou Points", toProgram: "Wyndham Rewards", ratioFrom: 1, ratioTo: 1 },

  // Capital One Miles — 18 airlines + 4 hotels. Its Virgin Red partner moves points on to
  // Virgin Atlantic Flying Club 1:1, so it's modeled as Flying Club directly.
  { fromProgram: "Capital One Miles", toProgram: "Aeromexico Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Cathay Pacific Asia Miles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Emirates Skywards", ratioFrom: 4, ratioTo: 3 },
  { fromProgram: "Capital One Miles", toProgram: "Etihad Guest", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "EVA Infinity MileageLands", ratioFrom: 4, ratioTo: 3 },
  { fromProgram: "Capital One Miles", toProgram: "Finnair Plus", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Japan Airlines Mileage Bank", ratioFrom: 4, ratioTo: 3 },
  { fromProgram: "Capital One Miles", toProgram: "JetBlue TrueBlue", ratioFrom: 5, ratioTo: 3 },
  { fromProgram: "Capital One Miles", toProgram: "Qantas Frequent Flyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Qatar Airways Privilege Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Singapore KrisFlyer", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "TAP Miles&Go", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Turkish Miles&Smiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Accor Live Limitless", ratioFrom: 2, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "Choice Privileges", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Capital One Miles", toProgram: "I Prefer Hotel Rewards", ratioFrom: 1, ratioTo: 2 },
  { fromProgram: "Capital One Miles", toProgram: "Wyndham Rewards", ratioFrom: 1, ratioTo: 1 },

  // Bilt Rewards — 18 airlines + 7 hotels. American AAdvantage left in 2024.
  { fromProgram: "Bilt Rewards", toProgram: "Aer Lingus AerClub", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Air Canada Aeroplan", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Atmos Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Avianca LifeMiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "British Airways Avios", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Cathay Pacific Asia Miles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Emirates Skywards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Etihad Guest", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Air France-KLM Flying Blue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Iberia Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Japan Airlines Mileage Bank", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "JetBlue TrueBlue", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Qatar Airways Privilege Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Southwest Rapid Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "TAP Miles&Go", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Turkish Miles&Smiles", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "United MileagePlus", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Virgin Atlantic Flying Club", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Accor Live Limitless", ratioFrom: 3, ratioTo: 2 },
  { fromProgram: "Bilt Rewards", toProgram: "Hilton Honors", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "I Prefer Hotel Rewards", ratioFrom: 1, ratioTo: 2 },
  { fromProgram: "Bilt Rewards", toProgram: "IHG One Rewards", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Marriott Bonvoy", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "World of Hyatt", ratioFrom: 1, ratioTo: 1 },
  { fromProgram: "Bilt Rewards", toProgram: "Wyndham Rewards", ratioFrom: 1, ratioTo: 1 },
];
