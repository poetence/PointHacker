export const SPEND_CATEGORIES = [
  "DINING",
  "GROCERIES",
  "TRAVEL",
  "GAS",
  "TRANSIT",
  "ONLINE",
  "OTHER",
] as const;

export type SpendCategory = (typeof SPEND_CATEGORIES)[number];

export const SPEND_CATEGORY_LABELS: Record<SpendCategory, string> = {
  DINING: "Dining",
  GROCERIES: "Groceries",
  TRAVEL: "Travel",
  GAS: "Gas",
  TRANSIT: "Transit",
  ONLINE: "Streaming & online",
  OTHER: "Everything else",
};

/** The SpendingProfile column holding each category's monthly cents. */
export const SPEND_CENTS_FIELD = {
  DINING: "diningCents",
  GROCERIES: "groceriesCents",
  TRAVEL: "travelCents",
  GAS: "gasCents",
  TRANSIT: "transitCents",
  ONLINE: "onlineCents",
  OTHER: "otherCents",
} as const satisfies Record<SpendCategory, string>;

export type SpendCentsField = (typeof SPEND_CENTS_FIELD)[SpendCategory];

export type MonthlySpendCents = Record<SpendCategory, number>;

/** Points earned per dollar, keyed by category; anything missing uses the card's base rate. */
export type EarnRates = Partial<Record<SpendCategory, number>>;
