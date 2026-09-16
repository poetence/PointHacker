"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ALL_REGIONS, REGION_LABELS, type Region } from "@/lib/regions";
import {
  ALL_CABINS,
  ALL_GOAL_KINDS,
  ALL_HOTEL_TIERS,
  CABIN_LABELS,
  GOAL_KIND_LABELS,
  HOTEL_TIER_LABELS,
  type Cabin,
  type GoalKind,
  type HotelTier,
} from "@/lib/goals/cabins";
import { MAX_NIGHTS, MAX_ROOMS, MAX_TRAVELERS } from "@/lib/goals/parse-goal-input";
import type { GoalFormValues } from "@/lib/goals/goal-form-values";
import { ALL_US_STATES, US_STATES } from "@/lib/goals/origin-adjustment";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const EMPTY: GoalFormValues = {
  label: "",
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
  const [values, setValues] = useState<GoalFormValues>(
    initial ?? { ...EMPTY, originState: defaultOriginState }
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof GoalFormValues>(key: K, value: GoalFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(goalId ? `/api/goals/${goalId}` : "/api/goals", {
      method: goalId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        travelers: Number(values.travelers),
        nights: Number(values.nights),
        rooms: Number(values.rooms),
        originState: values.originState || null,
        targetMonth: values.targetMonth || null,
        notes: values.notes || null,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Something went wrong.");
      return;
    }

    if (!goalId) {
      const created = await response.json();
      router.push(`/goals/${created.id}`);
      return;
    }

    onSaved?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Where to?" hint="Free text — the region below is what prices it.">
          <Input
            required
            placeholder="Tokyo"
            value={values.label}
            onChange={(e) => set("label", e.target.value)}
          />
        </Field>

        <Field label="Region">
          <Select value={values.region} onChange={(e) => set("region", e.target.value as Region)}>
            {ALL_REGIONS.map((r) => (
              <option key={r} value={r}>
                {REGION_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="What">
          <Select value={values.kind} onChange={(e) => set("kind", e.target.value as GoalKind)}>
            {ALL_GOAL_KINDS.map((k) => (
              <option key={k} value={k}>
                {GOAL_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>

        {values.kind === "FLIGHT" ? (
          <>
            <Field label="Cabin">
              <Select value={values.cabin} onChange={(e) => set("cabin", e.target.value as Cabin)}>
                {ALL_CABINS.map((c) => (
                  <option key={c} value={c}>
                    {CABIN_LABELS[c]}
                  </option>
                ))}
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
                {ALL_US_STATES.map((code) => (
                  <option key={code} value={code}>
                    {US_STATES[code]}
                  </option>
                ))}
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
                {ALL_HOTEL_TIERS.map((t) => (
                  <option key={t} value={t}>
                    {HOTEL_TIER_LABELS[t]}
                  </option>
                ))}
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

        <Field label="When" hint="Optional — roughly when you want to go.">
          <Input
            type="month"
            value={values.targetMonth}
            onChange={(e) => set("targetMonth", e.target.value)}
          />
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
          {goalId ? "Save goal" : "Set this goal"}
        </Button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </form>
  );
}
