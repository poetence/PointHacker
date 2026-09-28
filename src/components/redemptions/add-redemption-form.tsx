"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type RedemptionProgramOption = {
  id: string;
  name: string;
  pointsUnit: string;
  /** Present when the user tracks a balance here, so the form can show it. */
  balance: number | null;
};

export type RedemptionGoalOption = { id: string; label: string };

/** Dollars in the UI, cents at the fetch boundary — the repo's money convention. */
function toCents(dollars: string): number {
  return Math.round(Number(dollars || 0) * 100);
}

export function AddRedemptionForm({
  programs,
  goals,
}: {
  programs: RedemptionProgramOption[];
  goals: RedemptionGoalOption[];
}) {
  const router = useRouter();
  const [rewardsProgramId, setRewardsProgramId] = useState(programs[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [pointsSpent, setPointsSpent] = useState("");
  const [cashValue, setCashValue] = useState("");
  const [feesPaid, setFeesPaid] = useState("");
  const [bookedOn, setBookedOn] = useState(new Date().toISOString().slice(0, 10));
  const [awardGoalId, setAwardGoalId] = useState("");
  const [deductFromBalance, setDeductFromBalance] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const program = programs.find((p) => p.id === rewardsProgramId) ?? null;
  const unit = program?.pointsUnit ?? "points";

  // Preview the rate as it's typed — the whole point of logging this is to see
  // what the booking was actually worth.
  const points = Number(pointsSpent);
  const netCents = toCents(cashValue) - toCents(feesPaid);
  const centsPerPoint = points > 0 ? netCents / points : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/redemptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rewardsProgramId,
        description,
        pointsSpent: Number(pointsSpent),
        cashValueCents: toCents(cashValue),
        feesPaidCents: toCents(feesPaid),
        bookedOn,
        awardGoalId: awardGoalId || null,
        deductFromBalance,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setDescription("");
    setPointsSpent("");
    setCashValue("");
    setFeesPaid("");
    setAwardGoalId("");
    router.refresh();
  }

  if (programs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No programs in the catalog yet.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="What did you book?">
        <Input
          required
          placeholder="ANA business class, SFO to HND"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Program">
          <Select
            value={rewardsProgramId}
            onChange={(e) => setRewardsProgramId(e.target.value)}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.balance !== null ? ` — ${p.balance.toLocaleString()} ${p.pointsUnit}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label={`${unit === "miles" ? "Miles" : "Points"} spent`}>
          <Input
            required
            type="number"
            min={1}
            step={1}
            placeholder="60000"
            value={pointsSpent}
            onChange={(e) => setPointsSpent(e.target.value)}
          />
        </Field>

        <Field label="Cash price it replaced" hint="What the same booking would have cost.">
          <Input
            required
            type="number"
            min={0}
            step="0.01"
            prefix="$"
            placeholder="1800.00"
            value={cashValue}
            onChange={(e) => setCashValue(e.target.value)}
          />
        </Field>

        <Field label="Taxes and fees paid" hint="Cash still paid on the award. Optional.">
          <Input
            type="number"
            min={0}
            step="0.01"
            prefix="$"
            placeholder="85.00"
            value={feesPaid}
            onChange={(e) => setFeesPaid(e.target.value)}
          />
        </Field>

        <Field label="Booked on">
          <Input
            required
            type="date"
            value={bookedOn}
            onChange={(e) => setBookedOn(e.target.value)}
          />
        </Field>

        {goals.length > 0 && (
          <Field label="For a goal?" hint="Optional.">
            <Select value={awardGoalId} onChange={(e) => setAwardGoalId(e.target.value)}>
              <option value="">Not linked to a goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {centsPerPoint !== null && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          That works out to{" "}
          <span className="font-display font-semibold text-emerald-600 dark:text-emerald-400">
            {centsPerPoint.toFixed(2)}¢
          </span>{" "}
          per {unit === "miles" ? "mile" : "point"}.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={deductFromBalance}
          onChange={(e) => setDeductFromBalance(e.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 dark:border-zinc-700"
        />
        Subtract these {unit} from my tracked balance
        {program?.balance === null && " (no balance tracked yet)"}
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging…" : "Log redemption"}
        </Button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </form>
  );
}
