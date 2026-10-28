// Card issuers' unofficial approval and welcome-bonus rules, read by
// `card-eligibility.ts`. A heuristic table in TS rather than seeded rows, like
// `origin-adjustment.ts`: none of it is published as a clean policy, so every
// rule carries where it came from and when it was last checked, and the UI
// says "likely" rather than "can't".
//
// Checked against issuer terms quoted by reviewers and aggregators in October
// 2026. Re-check the `verified: false` rows first. Deliberately not modeled:
// velocity limits (Chase 2/30, Capital One and Wells Fargo 1 per 6 months, Amex's
// cap on open credit cards), which depend on applications we don't record.

export type BonusRule =
  /** No bonus if you've ever held the card (Amex's once-per-lifetime language). */
  | { kind: "ever_held" }
  /** No bonus if you got this card's bonus within `months`; null = ever. */
  | { kind: "bonus_within"; months: number | null }
  /** No bonus if you opened the card within `months`. */
  | { kind: "opened_within"; months: number };

export type ProductRef = { issuer: string; name: string };

export type CardRule = {
  bonus?: BonusRule;
  /** Other cards that count as this one for the bonus rule (Amex "family" language). */
  family?: ProductRef[];
  source: string;
  checked: string;
  verified?: false;
};

export type IssuerRules = {
  /** Usually declined at five or more new cards from any issuer in 24 months. */
  fiveTwentyFour?: boolean;
  /** The issuer's default bonus rule; a card's own rule replaces it. */
  bonus?: BonusRule;
  source: string;
  checked: string;
  verified?: false;
  /** Keyed by catalog card `name`. */
  cards?: Record<string, CardRule>;
};

/**
 * Issuers whose business cards report to personal credit, so they count
 * toward 5/24. Some Capital One business cards (Venture X Business, Spark Cash
 * Plus) don't, but counting them errs toward not suggesting a likely denial.
 */
export const BUSINESS_CARDS_COUNT_TOWARD_524 = ["Capital One", "Discover"];

export const ISSUER_RULES: Record<string, IssuerRules> = {
  Chase: {
    fiveTwentyFour: true,
    bonus: { kind: "bonus_within", months: 24 },
    source: "Card terms: not for current cardmembers or anyone who got this card's bonus in the past 24 months",
    checked: "2026-10",
    cards: {
      "Sapphire Preferred": {
        bonus: { kind: "bonus_within", months: null },
        source: "Chase, 2026-01-22: one bonus per Sapphire card, ever (one source says a 60-month wait instead)",
        checked: "2026-10",
      },
      "Sapphire Reserve": {
        bonus: { kind: "bonus_within", months: null },
        source: "Chase, 2026-01-22: one bonus per Sapphire card, ever (one source says a 60-month wait instead)",
        checked: "2026-10",
      },
      "Marriott Bonvoy Boundless": {
        bonus: { kind: "bonus_within", months: 24 },
        family: [
          { issuer: "Chase", name: "Marriott Bonvoy Bold" },
          { issuer: "American Express", name: "Marriott Bonvoy Brilliant" },
          { issuer: "American Express", name: "Marriott Bonvoy Bevy" },
        ],
        source: "Card terms: a bonus on any of several Chase or Amex Marriott cards in 24 months blocks it",
        checked: "2026-10",
        verified: false,
      },
    },
  },
  "American Express": {
    bonus: { kind: "ever_held" },
    source: "Card terms: no welcome offer if you have or have had this card",
    checked: "2026-10",
    cards: {
      "Gold Card": {
        family: [{ issuer: "American Express", name: "Platinum Card" }],
        source: "Card terms since Oct 2023: having had a Platinum also blocks the Gold's offer",
        checked: "2026-10",
      },
      "Blue Cash Everyday": {
        family: [{ issuer: "American Express", name: "Blue Cash Preferred" }],
        source: "Card terms: having had the Blue Cash Preferred blocks the Everyday's offer",
        checked: "2026-10",
        verified: false,
      },
      "Delta SkyMiles Gold": {
        family: [
          { issuer: "American Express", name: "Delta SkyMiles Platinum" },
          { issuer: "American Express", name: "Delta SkyMiles Reserve" },
        ],
        source: "Card terms: a higher Delta card blocks the Gold's offer (sources disagree on the Reserve)",
        checked: "2026-10",
        verified: false,
      },
    },
  },
  Citi: {
    bonus: { kind: "bonus_within", months: 48 },
    source: "Card terms: no bonus if you got this card's bonus in the past 48 months",
    checked: "2026-10",
    cards: {
      "Strata Premier": {
        bonus: { kind: "ever_held" },
        source: "Citi, 2026-09-20: no bonus if you have or have had the card (was 48 months)",
        checked: "2026-10",
      },
    },
  },
  "Capital One": {
    bonus: { kind: "bonus_within", months: 48 },
    source: "Venture X terms: no bonus if you got this card's bonus in the past 48 months",
    checked: "2026-10",
    cards: {
      Savor: {
        bonus: { kind: "bonus_within", months: 48 },
        source: "Assumed to follow the Venture X's 48-month rule; no current source",
        checked: "2026-10",
        verified: false,
      },
    },
  },
  "Wells Fargo": {
    bonus: { kind: "opened_within", months: 48 },
    source: "Active Cash terms: no bonus if you have the card or opened one in the past 48 months",
    checked: "2026-10",
  },
};
