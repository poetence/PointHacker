// Options for the goal form's "When" picker: the next N months as "YYYY-MM" values,
// so the target month is a pick rather than a typed date. Pure and DB-agnostic.

export type MonthOption = { value: string; label: string };

export const TARGET_MONTH_COUNT = 24;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toMonthOption(value: string): MonthOption {
  const [year, month] = value.split("-").map(Number);
  return { value, label: `${MONTH_NAMES[month - 1]} ${year}` };
}

/** The current month (UTC) and the following `count - 1` months, oldest first. */
export function upcomingMonths(now: Date, count = TARGET_MONTH_COUNT): MonthOption[] {
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth();
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(startYear, startMonth + i, 1));
    const value = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return toMonthOption(value);
  });
}

/**
 * Picker options: the upcoming months, plus `current` (an existing goal's month) at the
 * right spot if it falls outside that window so editing never silently drops it.
 */
export function targetMonthOptions(now: Date, current: string): MonthOption[] {
  const options = upcomingMonths(now);
  if (!current || options.some((o) => o.value === current)) return options;
  return [...options, toMonthOption(current)].sort((a, b) => a.value.localeCompare(b.value));
}
