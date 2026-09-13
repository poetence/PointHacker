export type ExpirationStatus = "none" | "expiring_soon" | "expired";

export const EXPIRING_SOON_WINDOW_DAYS = 60;

export function getExpirationStatus(input: {
  lastUpdatedAt: Date;
  expirationMonths: number | null;
  overrideAt: Date | null;
  now?: Date;
}): { status: ExpirationStatus; expiresAt: Date | null } {
  const now = input.now ?? new Date();

  const expiresAt = input.overrideAt
    ? input.overrideAt
    : input.expirationMonths !== null
      ? addMonths(input.lastUpdatedAt, input.expirationMonths)
      : null;

  if (!expiresAt) {
    return { status: "none", expiresAt: null };
  }

  if (expiresAt.getTime() <= now.getTime()) {
    return { status: "expired", expiresAt };
  }

  const warningThreshold = new Date(now.getTime() + EXPIRING_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (expiresAt.getTime() <= warningThreshold.getTime()) {
    return { status: "expiring_soon", expiresAt };
  }

  return { status: "none", expiresAt };
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}
