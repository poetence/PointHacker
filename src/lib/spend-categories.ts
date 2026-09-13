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

export type MonthlySpendCents = Record<SpendCategory, number>;

/** Points earned per dollar, keyed by category; anything missing uses the card's base rate. */
export type EarnRates = Partial<Record<SpendCategory, number>>;
