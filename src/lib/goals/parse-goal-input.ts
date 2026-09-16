import { isRegion, type Region } from "@/lib/regions";
import { isCabin, isGoalKind, isHotelTier, type Cabin, type GoalKind, type HotelTier } from "./cabins";

export type GoalInput = {
  label: string;
  kind: GoalKind;
  region: Region;
  cabin: Cabin;
  travelers: number;
  roundTrip: boolean;
  hotelTier: HotelTier;
  nights: number;
  rooms: number;
  targetMonth: Date | null;
  notes: string | null;
};

export const MAX_TRAVELERS = 9;
export const MAX_NIGHTS = 30;
export const MAX_ROOMS = 5;

function isIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Validates a JSON body for the goals API. Returns a full input or an error message.
 * Both flight and hotel fields are always stored (with defaults) so switching kind
 * later doesn't lose what the user typed; only the active kind's fields are validated.
 */
export function parseGoalInput(body: unknown): { input: GoalInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }
  const { label, kind, region, cabin, travelers, roundTrip, hotelTier, nights, rooms, targetMonth, notes } =
    body as Record<string, unknown>;

  if (typeof label !== "string" || label.trim().length === 0) {
    return { error: "label is required." };
  }
  const goalKind = kind === undefined ? "FLIGHT" : kind;
  if (typeof goalKind !== "string" || !isGoalKind(goalKind)) {
    return { error: "kind must be FLIGHT or HOTEL." };
  }
  if (typeof region !== "string" || !isRegion(region)) {
    return { error: "region must be a known region." };
  }

  const flight = {
    cabin: cabin === undefined ? "ECONOMY" : cabin,
    travelers: travelers === undefined ? 1 : travelers,
    roundTrip: roundTrip === undefined ? true : roundTrip,
  };
  if (typeof flight.cabin !== "string" || !isCabin(flight.cabin)) {
    return { error: "cabin must be one of ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST." };
  }
  if (!isIntInRange(flight.travelers, 1, MAX_TRAVELERS)) {
    return { error: `travelers must be an integer between 1 and ${MAX_TRAVELERS}.` };
  }
  if (typeof flight.roundTrip !== "boolean") {
    return { error: "roundTrip must be a boolean." };
  }

  const hotel = {
    hotelTier: hotelTier === undefined ? "UPSCALE" : hotelTier,
    nights: nights === undefined ? 1 : nights,
    rooms: rooms === undefined ? 1 : rooms,
  };
  if (typeof hotel.hotelTier !== "string" || !isHotelTier(hotel.hotelTier)) {
    return { error: "hotelTier must be one of STANDARD, UPSCALE, LUXURY." };
  }
  if (!isIntInRange(hotel.nights, 1, MAX_NIGHTS)) {
    return { error: `nights must be an integer between 1 and ${MAX_NIGHTS}.` };
  }
  if (!isIntInRange(hotel.rooms, 1, MAX_ROOMS)) {
    return { error: `rooms must be an integer between 1 and ${MAX_ROOMS}.` };
  }

  let targetMonthDate: Date | null = null;
  if (targetMonth !== null && targetMonth !== undefined) {
    // Accepts "YYYY-MM" (from <input type="month">) or any ISO date; snaps to the 1st.
    if (typeof targetMonth !== "string") {
      return { error: "targetMonth must be a YYYY-MM string or null." };
    }
    const parsed = new Date(/^\d{4}-\d{2}$/.test(targetMonth) ? `${targetMonth}-01` : targetMonth);
    if (Number.isNaN(parsed.getTime())) {
      return { error: "targetMonth must be a valid date." };
    }
    targetMonthDate = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1));
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return { error: "notes must be a string." };
  }

  return {
    input: {
      label: label.trim(),
      kind: goalKind,
      region,
      cabin: flight.cabin,
      travelers: flight.travelers,
      roundTrip: flight.roundTrip,
      hotelTier: hotel.hotelTier,
      nights: hotel.nights,
      rooms: hotel.rooms,
      targetMonth: targetMonthDate,
      notes: typeof notes === "string" && notes.trim().length > 0 ? notes.trim() : null,
    },
  };
}
