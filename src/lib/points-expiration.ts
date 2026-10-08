export type ExpirationStatus = "none" | "expiring_soon" | "expired";

export const EXPIRING_SOON_WINDOW_DAYS = 60;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getExpirationStatus(input: {
  lastUpdatedAt: Date;
  expirationMonths: number | null;
  overrideAt: Date | null;
  now?: Date;
}): { status: ExpirationStatus; expiresAt: Date | null } {
  const now = input.now ?? new Date();

  const expiresAt = expiryDate(input);

  if (!expiresAt) {
    return { status: "none", expiresAt: null };
  }

  if (expiresAt.getTime() <= now.getTime()) {
    return { status: "expired", expiresAt };
  }

  const warningThreshold = new Date(now.getTime() + EXPIRING_SOON_WINDOW_DAYS * ONE_DAY_MS);
  if (expiresAt.getTime() <= warningThreshold.getTime()) {
    return { status: "expiring_soon", expiresAt };
  }

  return { status: "none", expiresAt };
}

/** A known fixed date wins; otherwise the inactivity window from the last update, if the program has one. */
function expiryDate({
  lastUpdatedAt,
  expirationMonths,
  overrideAt,
}: {
  lastUpdatedAt: Date;
  expirationMonths: number | null;
  overrideAt: Date | null;
}): Date | null {
  if (overrideAt) return overrideAt;
  if (expirationMonths === null) return null;
  return addMonths(lastUpdatedAt, expirationMonths);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
