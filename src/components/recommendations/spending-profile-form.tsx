"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SPEND_CATEGORIES, SPEND_CATEGORY_LABELS, type SpendCategory } from "@/lib/spend-categories";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type ProfileFormValues = {
  monthlySpendCents: Record<SpendCategory, number>;
  rewardsPreference: "ANY" | "TRAVEL" | "CASHBACK";
  maxAnnualFeeCents: number | null;
};

const FIELD_BY_CATEGORY: Record<SpendCategory, string> = {
  DINING: "diningCents",
  GROCERIES: "groceriesCents",
  TRAVEL: "travelCents",
  GAS: "gasCents",
  TRANSIT: "transitCents",
  ONLINE: "onlineCents",
  OTHER: "otherCents",
};

/** Slider ceilings in dollars — the number box still accepts anything above these. */
const SLIDER_MAX: Record<SpendCategory, number> = {
  DINING: 2000,
  GROCERIES: 2000,
  TRAVEL: 3000,
  GAS: 800,
  TRANSIT: 500,
  ONLINE: 500,
  OTHER: 5000,
};

const SLIDER_STEP = 25;

export function SpendingProfileForm({ initial }: { initial: ProfileFormValues | null }) {
  const router = useRouter();
  const [spend, setSpend] = useState<Record<SpendCategory, string>>(() => {
    const values = {} as Record<SpendCategory, string>;
    for (const category of SPEND_CATEGORIES) {
      const cents = initial?.monthlySpendCents[category] ?? 0;
      values[category] = cents > 0 ? String(cents / 100) : "";
    }
    return values;
  });
  const [preference, setPreference] = useState(initial?.rewardsPreference ?? "ANY");
  const [maxFee, setMaxFee] = useState(
    initial?.maxAnnualFeeCents != null ? String(initial.maxAnnualFeeCents / 100) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthlyTotal = SPEND_CATEGORIES.reduce((sum, c) => sum + (Number(spend[c]) || 0), 0);

  function setCategory(category: SpendCategory, value: string) {
    setSpend((prev) => ({ ...prev, [category]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const body: Record<string, unknown> = {
      rewardsPreference: preference,
      maxAnnualFeeCents: maxFee === "" ? null : Math.round(Number(maxFee) * 100),
    };
    for (const category of SPEND_CATEGORIES) {
      body[FIELD_BY_CATEGORY[category]] = Math.round(Number(spend[category] || 0) * 100);
    }

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Roughly how much do you spend per month?
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Total{" "}
          <span className="font-medium text-black dark:text-zinc-50">
            ${monthlyTotal.toLocaleString()}
          </span>
          /mo
        </p>
      </div>

      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {SPEND_CATEGORIES.map((category) => {
          const value = Number(spend[category]) || 0;
          return (
            <div key={category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {SPEND_CATEGORY_LABELS[category]}
                </span>
                <Input
                  size="sm"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="0"
                  prefix="$"
                  aria-label={`${SPEND_CATEGORY_LABELS[category]} per month`}
                  value={spend[category]}
                  onChange={(e) => setCategory(category, e.target.value)}
                  className="w-28 text-right"
                />
              </div>
              <input
                type="range"
                min={0}
                max={SLIDER_MAX[category]}
                step={SLIDER_STEP}
                value={Math.min(value, SLIDER_MAX[category])}
                onChange={(e) => setCategory(category, e.target.value)}
                aria-label={`${SPEND_CATEGORY_LABELS[category]} slider`}
                className="w-full cursor-pointer accent-emerald-600"
              />
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
        <Field label="I want" className="w-44">
          <Select
            value={preference}
            onChange={(e) => setPreference(e.target.value as ProfileFormValues["rewardsPreference"])}
          >
            <option value="ANY">Any rewards</option>
            <option value="TRAVEL">Travel points</option>
            <option value="CASHBACK">Cash back</option>
          </Select>
        </Field>

        <Field label="Max annual fee" className="w-36">
          <Input
            type="number"
            min={0}
            step={1}
            placeholder="No limit"
            prefix="$"
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
          />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {initial ? "Update recommendations" : "Get recommendations"}
        </Button>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </form>
  );
}
