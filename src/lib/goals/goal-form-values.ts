import type { AwardGoal } from "@prisma/client";
import type { Region } from "@/lib/regions";
import type { Cabin, GoalKind, HotelTier } from "./cabins";

/** What the goal form edits — strings where the inputs are text/month controls. */
export type GoalFormValues = {
  label: string;
  kind: GoalKind;
  region: Region;
  cabin: Cabin;
  travelers: number;
  roundTrip: boolean;
  hotelTier: HotelTier;
  nights: number;
  rooms: number;
  /** "YYYY-MM" or "" */
  targetMonth: string;
  notes: string;
};

export function toGoalFormValues(goal: AwardGoal): GoalFormValues {
  return {
    label: goal.label,
    kind: goal.kind,
    region: goal.region,
    cabin: goal.cabin,
    travelers: goal.travelers,
    roundTrip: goal.roundTrip,
    hotelTier: goal.hotelTier,
    nights: goal.nights,
    rooms: goal.rooms,
    targetMonth: goal.targetMonth ? goal.targetMonth.toISOString().slice(0, 7) : "",
    notes: goal.notes ?? "",
  };
}
