"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};
const FORMAT = { month: "short", day: "numeric", year: "numeric" } as const;

/**
 * A moment in time (not a calendar date) shown as the reader's own date. The
 * server can't know their time zone, so it renders UTC and the browser swaps
 * in the local date after hydration; without that, an evening update in the
 * US was listed under the next day. Calendar-only values stored as UTC
 * midnight (promo dates, expiry overrides) should format with timeZone "UTC"
 * instead, since shifting those would move them a day.
 */
export function LocalDate({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    noSubscription,
    () => new Date(iso).toLocaleDateString("en-US", FORMAT),
    () => new Date(iso).toLocaleDateString("en-US", { ...FORMAT, timeZone: "UTC" })
  );
  return <time dateTime={iso}>{text}</time>;
}
