"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { REGION_LABELS } from "@/lib/regions";
import { DESTINATIONS_BY_REGION, findDestination } from "@/lib/goals/destinations";
import { targetMonthOptions } from "@/lib/goals/target-months";
import {
  CABIN_LABELS,
  GOAL_KIND_LABELS,
  HOTEL_TIER_LABELS,
  type Cabin,
  type GoalKind,
  type HotelTier,
} from "@/lib/goals/cabins";
import { MAX_NIGHTS, MAX_ROOMS, MAX_TRAVELERS } from "@/lib/goals/parse-goal-input";
import type { GoalFormValues } from "@/lib/goals/goal-form-values";
import { US_STATES } from "@/lib/goals/origin-adjustment";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LabelOptions, Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useWarnOnLeave } from "@/components/ui/use-warn-on-leave";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";

const EMPTY: GoalFormValues = {
  label: "Tokyo",
  kind: "FLIGHT",
  region: "ASIA",
  cabin: "BUSINESS",
  travelers: 2,
  roundTrip: true,
  hotelTier: "UPSCALE",
  nights: 4,
  rooms: 1,
  originState: "",
  targetMonth: "",
  notes: "",
};

/**
 * Creates a goal when `goalId` is absent; otherwise replaces that goal.
 * `defaultOriginState` pre-fills "Flying from" on a new goal (typically the last goal's origin).
 */
export function GoalForm({
  goalId,
  initial,
  defaultOriginState = "",
  onSaved,
}: {
  goalId?: string;
  initial?: GoalFormValues;
  defaultOriginState?: string;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [startingValues] = useState<GoalFormValues>(
    () => initial ?? { ...EMPTY, originState: defaultOriginState }
  );
  const [values, setValues] = useState<GoalFormValues>(startingValues);
  useWarnOnLeave(JSON.stringify(values) !== JSON.stringify(startingValues));
  const { submit, isSubmitting, error } = useJsonSubmit();

  // Goals saved before the picker existed may carry a free-text label; keep it selectable
  // under its region so editing doesn't silently rename the trip.
  const destinationGroups = useMemo(() => {
    const label = initial?.label;
    if (!label || findDestination(label)) return DESTINATIONS_BY_REGION;
    return DESTINATIONS_BY_REGION.map((group) =>
      group.region === initial.region
        ? { ...group, destinations: [{ label, region: group.region }, ...group.destinations] }
        : group
    );
  }, [initial]);
  const monthOptions = useMemo(
    () => targetMonthOptions(new Date(), initial?.targetMonth ?? ""),
    [initial]
  );

  function set<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function setDestination(label: string) {
    const region = findDestination(label)?.region ?? initial?.region ?? values.region;
    setValues((prev) => ({ ...prev, label, region }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = await submit<{ id: string }>(
      goalId ? `/api/goals/${goalId}` : "/api/goals",
      goalId ? "PUT" : "POST",
      {
        ...values,
        travelers: Number(values.travelers),
        nights: Number(values.nights),
        rooms: Number(values.rooms),
        originState: values.originState || null,
        targetMonth: values.targetMonth || null,
        notes: values.notes || null,
      }
    );

    if (!result.ok) return;

    if (!goalId) {
      router.push(`/goals/${result.data.id}`);
      return;
    }

    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Where to?" hint={`Priced as ${REGION_LABELS[values.region]}.`}>
          <Select value={values.label} onChange={(e) => setDestination(e.target.value)}>
            {destinationGroups.map((group) => (
              <optgroup key={group.region} label={REGION_LABELS[group.region]}>
                {group.destinations.map((d) => (
                  <option key={d.label} value={d.label}>
                    {d.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Field label="What">
          <Select value={values.kind} onChange={(e) => set("kind", e.target.value as GoalKind)}>
            <LabelOptions labels={GOAL_KIND_LABELS} />
          </Select>
        </Field>

        {values.kind === "FLIGHT" ? (
          <>
            <Field label="Cabin">
              <Select value={values.cabin} onChange={(e) => set("cabin", e.target.value as Cabin)}>
                <LabelOptions labels={CABIN_LABELS} />
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Travelers">
                <Input
                  type="number"
                  min={1}
                  max={MAX_TRAVELERS}
                  step={1}
                  required
                  value={values.travelers}
                  onChange={(e) => set("travelers", Number(e.target.value))}
                />
              </Field>

              <Field label="Trip">
                <Select
                  value={values.roundTrip ? "round" : "one-way"}
                  onChange={(e) => set("roundTrip", e.target.value === "round")}
                >
                  <option value="round">Round trip</option>
                  <option value="one-way">One way</option>
                </Select>
              </Field>
            </div>

            <Field label="Flying from" hint="Nudges prices by coast — Asia is cheaper from the West, Europe from the East.">
              <Select value={values.originState} onChange={(e) => set("originState", e.target.value)}>
                <option value="">Anywhere in the US</option>
                <LabelOptions labels={US_STATES} />
              </Select>
            </Field>
          </>
        ) : (
          <>
            <Field label="Hotel tier" hint="Standard ≈ mid-market, upscale ≈ full-service, luxury ≈ top brands.">
              <Select
                value={values.hotelTier}
                onChange={(e) => set("hotelTier", e.target.value as HotelTier)}
              >
                <LabelOptions labels={HOTEL_TIER_LABELS} />
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Nights">
                <Input
                  type="number"
                  min={1}
                  max={MAX_NIGHTS}
                  step={1}
                  required
                  value={values.nights}
                  onChange={(e) => set("nights", Number(e.target.value))}
                />
              </Field>

              <Field label="Rooms">
                <Input
                  type="number"
                  min={1}
                  max={MAX_ROOMS}
                  step={1}
                  required
                  value={values.rooms}
                  onChange={(e) => set("rooms", Number(e.target.value))}
                />
              </Field>
            </div>
          </>
        )}

        <Field label="When" hint="Roughly when you want to go.">
          <Select value={values.targetMonth} onChange={(e) => set("targetMonth", e.target.value)}>
            <option value="">Not sure yet</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Notes">
          <Input
            placeholder="Optional"
            value={values.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : goalId ? "Save goal" : "Set this goal"}
        </Button>
        <FormError message={error} />
      </div>
    </form>
  );
}
