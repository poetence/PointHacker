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
