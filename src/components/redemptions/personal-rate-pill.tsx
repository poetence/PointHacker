import type { ProgramRateStatus } from "@/lib/redemptions/personal-rates";

/**
 * Tags a value that rests on the user's own logged bookings rather than the
 * program's estimate. Neutral zinc: it's provenance, not good news, and emerald
 * stays the one accent.
 */
export function PersonalRatePill({ rate }: { rate: ProgramRateStatus }) {
  return (
    <span className="ml-2 whitespace-nowrap rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      your rate · {rate.bookings} bookings
    </span>
  );
}
