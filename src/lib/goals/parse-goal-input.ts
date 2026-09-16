import { isRegion, type Region } from "@/lib/regions";
import { isCabin, type Cabin } from "./cabins";

export type GoalInput = {
  label: string;
  region: Region;
  cabin: Cabin;
  travelers: number;
  roundTrip: boolean;
  targetMonth: Date | null;
  notes: string | null;
};

export const MAX_TRAVELERS = 9;

/** Validates a JSON body for the goals API. Returns a full input or an error message. */
export function parseGoalInput(body: unknown): { input: GoalInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be a JSON object." };
  }
  const { label, region, cabin, travelers, roundTrip, targetMonth, notes } = body as Record<string, unknown>;

  if (typeof label !== "string" || label.trim().length === 0) {
    return { error: "label is required." };
  }
  if (typeof region !== "string" || !isRegion(region)) {
    return { error: "region must be a known region." };
  }
  if (typeof cabin !== "string" || !isCabin(cabin)) {
    return { error: "cabin must be one of ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST." };
  }
  if (
    typeof travelers !== "number" ||
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > MAX_TRAVELERS
  ) {
    return { error: `travelers must be an integer between 1 and ${MAX_TRAVELERS}.` };
  }
  if (typeof roundTrip !== "boolean") {
    return { error: "roundTrip must be a boolean." };
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
      region,
      cabin,
      travelers,
      roundTrip,
      targetMonth: targetMonthDate,
      notes: typeof notes === "string" && notes.trim().length > 0 ? notes.trim() : null,
    },
  };
}
