"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SPEND_CATEGORIES, SPEND_CATEGORY_LABELS, type SpendCategory } from "@/lib/spend-categories";

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

const inputClass =
  "w-28 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900";

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Roughly how much do you spend per month, in dollars?
      </p>

      <div className="flex flex-wrap gap-3">
        {SPEND_CATEGORIES.map((category) => (
          <label key={category} className="flex flex-col gap-1 text-sm">
            {SPEND_CATEGORY_LABELS[category]}
            <input
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={spend[category]}
              onChange={(e) => setSpend({ ...spend, [category]: e.target.value })}
              className={inputClass}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          I want
          <select
            value={preference}
            onChange={(e) => setPreference(e.target.value as ProfileFormValues["rewardsPreference"])}
            className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="ANY">Any rewards</option>
            <option value="TRAVEL">Travel points</option>
            <option value="CASHBACK">Cash back</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Max annual fee ($, blank = no limit)
          <input
            type="number"
            min={0}
            step={1}
            value={maxFee}
            onChange={(e) => setMaxFee(e.target.value)}
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {initial ? "Update recommendations" : "Get recommendations"}
        </button>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </form>
  );
}
