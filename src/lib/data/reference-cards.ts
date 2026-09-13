// Maintained reference catalog of credit card products for the recommender.
// Loaded by `prisma/seed.ts` via upsert keyed on (issuer, name). Earn rates,
// fees, and welcome bonuses are best-effort snapshots of public offers and
// drift constantly — verify with the issuer before applying for anything.

import type { EarnRates } from "@/lib/spend-categories";

export type ReferenceCard = {
  issuer: string;
  name: string;
  /** `name` of the RewardsProgram this card earns into (must appear in referencePrograms). */
  program: string;
  annualFeeCents: number;
  welcomeBonusPoints?: number;
  welcomeBonusSpendCents?: number;
  welcomeBonusMonths?: number;
  /** Points per dollar on anything not listed in earnRates. */
  baseEarnRate: number;
  earnRates?: EarnRates;
  /** Drives the generated card-art tile; premium cards get a dark metallic treatment. */
  tier?: "premium";
  notes?: string;
};

export const referenceCards: ReferenceCard[] = [
  // Chase
  {
    issuer: "Chase",
    name: "Sapphire Preferred",
    program: "Chase Ultimate Rewards",
    annualFeeCents: 9500,
    welcomeBonusPoints: 60000,
    welcomeBonusSpendCents: 400000,
    welcomeBonusMonths: 3,
    baseEarnRate: 1,
    earnRates: { DINING: 3, TRAVEL: 2, ONLINE: 3 },
    notes: "3x on dining and select streaming; 2x on travel; 5x on Chase Travel.",
  },
  {
    issuer: "Chase",
    name: "Sapphire Reserve",
    tier: "premium",
    program: "Chase Ultimate Rewards",
    annualFeeCents: 79500,
    welcomeBonusPoints: 60000,
    welcomeBonusSpendCents: 500000,
    welcomeBonusMonths: 3,
    baseEarnRate: 1,
    earnRates: { DINING: 3, TRAVEL: 4 },
    notes: "Large fee partly offset by a $300 travel credit not modeled here.",
  },
  {
    issuer: "Chase",
    name: "Freedom Unlimited",
    program: "Chase Ultimate Rewards",
    annualFeeCents: 0,
    welcomeBonusPoints: 20000,
    welcomeBonusSpendCents: 50000,
    welcomeBonusMonths: 3,
    baseEarnRate: 1.5,
    earnRates: { DINING: 3 },
  },
  {
    issuer: "Chase",
    name: "World of Hyatt Credit Card",
    program: "World of Hyatt",
    annualFeeCents: 9500,
    welcomeBonusPoints: 60000,
    welcomeBonusSpendCents: 600000,
    welcomeBonusMonths: 6,
    baseEarnRate: 1,
    earnRates: { DINING: 2, TRAVEL: 2, TRANSIT: 2 },
  },
  {
    issuer: "Chase",
    name: "United Explorer",
    program: "United MileagePlus",
    annualFeeCents: 9500,
    welcomeBonusPoints: 60000,
    welcomeBonusSpendCents: 300000,
    welcomeBonusMonths: 3,
    baseEarnRate: 1,
    earnRates: { DINING: 2, TRAVEL: 2 },
  },
  {
    issuer: "Chase",
    name: "Marriott Bonvoy Boundless",
    program: "Marriott Bonvoy",
    annualFeeCents: 9500,
    welcomeBonusPoints: 100000,
    welcomeBonusSpendCents: 500000,
    welcomeBonusMonths: 3,
    baseEarnRate: 2,
    earnRates: { TRAVEL: 3 },
  },

  // American Express
  {
    issuer: "American Express",
    name: "Gold Card",
    program: "American Express Membership Rewards",
    annualFeeCents: 32500,
    welcomeBonusPoints: 60000,
    welcomeBonusSpendCents: 600000,
    welcomeBonusMonths: 6,
    baseEarnRate: 1,
    earnRates: { DINING: 4, GROCERIES: 4, TRAVEL: 3 },
    notes: "Monthly dining/Uber credits not modeled here.",
  },
  {
    issuer: "American Express",
    name: "Platinum Card",
    tier: "premium",
    program: "American Express Membership Rewards",
    annualFeeCents: 69500,
    welcomeBonusPoints: 80000,
    welcomeBonusSpendCents: 800000,
    welcomeBonusMonths: 6,
    baseEarnRate: 1,
    earnRates: { TRAVEL: 5 },
    notes: "Value is mostly lounge access and statement credits, none of which are modeled.",
  },
  {
    issuer: "American Express",
    name: "Blue Cash Preferred",
    program: "Amex Blue Cash Reward Dollars",
    annualFeeCents: 9500,
    welcomeBonusPoints: 25000,
    welcomeBonusSpendCents: 300000,
    welcomeBonusMonths: 6,
    baseEarnRate: 1,
    earnRates: { GROCERIES: 6, ONLINE: 6, GAS: 3, TRANSIT: 3 },
    notes: "6% groceries capped at $6k/yr; cap not modeled.",
  },
  {
    issuer: "American Express",
    name: "Blue Cash Everyday",
    program: "Amex Blue Cash Reward Dollars",
    annualFeeCents: 0,
    welcomeBonusPoints: 20000,
    welcomeBonusSpendCents: 200000,
    welcomeBonusMonths: 6,
    baseEarnRate: 1,
    earnRates: { GROCERIES: 3, ONLINE: 3, GAS: 3 },
  },
  {
    issuer: "American Express",
    name: "Delta SkyMiles Gold",
    program: "Delta SkyMiles",
    annualFeeCents: 15000,
    welcomeBonusPoints: 50000,
    welcomeBonusSpendCents: 200000,
    welcomeBonusMonths: 6,
    baseEarnRate: 1,
    earnRates: { DINING: 2, GROCERIES: 2, TRAVEL: 2 },
  },
  {
    issuer: "American Express",
    name: "Hilton Honors Surpass",
    program: "Hilton Honors",
    annualFeeCents: 15000,
    welcomeBonusPoints: 130000,
    welcomeBonusSpendCents: 300000,
    welcomeBonusMonths: 6,
    baseEarnRate: 3,
    earnRates: { DINING: 6, GROCERIES: 6, GAS: 6, TRAVEL: 4 },
  },

  // Capital One
  {
    issuer: "Capital One",
    name: "Venture X",
    tier: "premium",
    program: "Capital One Miles",
    annualFeeCents: 39500,
    welcomeBonusPoints: 75000,
    welcomeBonusSpendCents: 400000,
    welcomeBonusMonths: 3,
    baseEarnRate: 2,
    earnRates: { TRAVEL: 5 },
    notes: "$300 travel credit and anniversary miles not modeled here.",
  },
  {
    issuer: "Capital One",
    name: "Savor",
    program: "Capital One Cash Back",
    annualFeeCents: 0,
    welcomeBonusPoints: 20000,
    welcomeBonusSpendCents: 50000,
    welcomeBonusMonths: 3,
    baseEarnRate: 1,
    earnRates: { DINING: 3, GROCERIES: 3, ONLINE: 3 },
  },

  // Citi
  {
    issuer: "Citi",
    name: "Strata Premier",
    program: "Citi ThankYou Points",
    annualFeeCents: 9500,
    welcomeBonusPoints: 60000,
    welcomeBonusSpendCents: 400000,
    welcomeBonusMonths: 3,
    baseEarnRate: 1,
    earnRates: { DINING: 3, GROCERIES: 3, GAS: 3, TRAVEL: 3 },
  },
  {
    issuer: "Citi",
    name: "Double Cash",
    program: "Citi ThankYou Points",
    annualFeeCents: 0,
    welcomeBonusPoints: 20000,
    welcomeBonusSpendCents: 150000,
    welcomeBonusMonths: 6,
    baseEarnRate: 2,
  },

  // Others
  {
    issuer: "Bilt",
    name: "Bilt Mastercard",
    program: "Bilt Rewards",
    annualFeeCents: 0,
    baseEarnRate: 1,
    earnRates: { DINING: 3, TRAVEL: 2 },
    notes: "1x on rent with no fee is the real draw; rent isn't a modeled category.",
  },
  {
    issuer: "Wells Fargo",
    name: "Active Cash",
    program: "Wells Fargo Rewards",
    annualFeeCents: 0,
    welcomeBonusPoints: 20000,
    welcomeBonusSpendCents: 50000,
    welcomeBonusMonths: 3,
    baseEarnRate: 2,
  },
  {
    issuer: "Discover",
    name: "Discover it Cash Back",
    program: "Discover Cashback Bonus",
    annualFeeCents: 0,
    baseEarnRate: 1,
    notes: "5% rotating categories and first-year cashback match aren't modeled.",
  },
];
