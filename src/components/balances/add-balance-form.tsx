"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProgramPickerModal, type PickableProgram } from "@/components/programs/program-picker-modal";
import { sortProgramsByPriority } from "@/lib/program-priority";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AddBalanceForm({ programs }: { programs: PickableProgram[] }) {
  const router = useRouter();
  const orderedPrograms = sortProgramsByPriority(programs);
  const [selectedProgram, setSelectedProgram] = useState<PickableProgram | null>(
    orderedPrograms[0] ?? null
  );
  const [balance, setBalance] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (programs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        You already have a balance tracked for every active program.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedProgram) {
      setError("Choose a program first.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/balances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rewardsProgramId: selectedProgram.id,
        balance: Number(balance),
        expiresOverrideAt: expiresOn || undefined,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setBalance("");
    setExpiresOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Program</span>
        <ProgramPickerModal
          programs={programs}
          selectedProgram={selectedProgram}
          onSelect={setSelectedProgram}
        />
      </div>

      <Field label={selectedProgram?.pointsUnit === "miles" ? "Miles" : "Points"} className="w-36">
        <Input
          type="number"
          min={0}
          step={1}
          required
          placeholder="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
      </Field>

      <Field label="Expires on (optional)">
        <Input type="date" value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        Add balance
      </Button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
