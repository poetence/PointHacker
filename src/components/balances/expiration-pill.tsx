import { getExpirationStatus } from "@/lib/points-expiration";

export function ExpirationPill({
  lastUpdatedAt,
  expirationMonths,
  overrideAt,
}: {
  lastUpdatedAt: Date;
  expirationMonths: number | null;
  overrideAt: Date | null;
}) {
  const { status, expiresAt } = getExpirationStatus({ lastUpdatedAt, expirationMonths, overrideAt });

  if (status === "none" || !expiresAt) {
    return null;
  }

  const dateLabel = expiresAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "expired"
          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      }`}
    >
      {status === "expired" ? "Likely expired" : "Expiring soon"} · {dateLabel}
    </span>
  );
}
