// Field checks shared by the API routes and the parse-*-input modules, so a
// rule like "a non-negative whole number" has one definition and one message.

export function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function isNonNegativeInteger(value: unknown): value is number {
  return isIntInRange(value, 0, Infinity);
}

/** A `Date` for a parseable date string, or null when it doesn't parse. */
export function toValidDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * An optional date field from a JSON body. Absent stays `undefined` (leave it
 * alone); `null` clears it where `nullable`, otherwise it's rejected like any
 * other non-string.
 */
export function parseOptionalDate(
  value: unknown,
  field: string,
  { nullable = false }: { nullable?: boolean } = {}
): { value: Date | null | undefined } | { error: string } {
  if (value === undefined) return { value: undefined };
  if (value === null && nullable) return { value: null };
  if (typeof value !== "string") return { error: `${field} must be a date string.` };

  const date = toValidDate(value);
  return date ? { value: date } : { error: `${field} must be a valid date.` };
}

/** Field names a card's welcome-bonus terms and progress are sent under. */
const BONUS_INT_FIELDS = ["bonusPoints", "bonusSpendCents", "bonusMonths", "bonusSpentCents"] as const;
type BonusField = (typeof BONUS_INT_FIELDS)[number];

/**
 * A card's bonus fields from a JSON body: each absent (leave it alone), null
 * (clear it), or a non-negative whole number; months, when given, at least 1.
 */
export function parseBonusFields(
  fields: Record<BonusField, unknown>
): { value: Record<BonusField, number | null | undefined> } | { error: string } {
  const value = {} as Record<BonusField, number | null | undefined>;
  for (const field of BONUS_INT_FIELDS) {
    const raw = fields[field];
    if (raw !== undefined && raw !== null && !isNonNegativeInteger(raw)) {
      return { error: `${field} must be a non-negative integer.` };
    }
    value[field] = raw;
  }
  if (value.bonusMonths === 0) return { error: "bonusMonths must be at least 1." };
  return { value };
}
