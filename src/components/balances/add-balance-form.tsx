"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProgramPickerModal, type PickableProgram } from "@/components/programs/program-picker-modal";
import { sortProgramsByPriority } from "@/lib/program-priority";

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
      <div className="flex flex-col gap-1 text-sm">
        Program
        <ProgramPickerModal
          programs={programs}
          selectedProgram={selectedProgram}
          onSelect={setSelectedProgram}
        />
      </div>

      <label className="flex flex-col gap-1 text-sm">
        {selectedProgram?.pointsUnit === "miles" ? "Miles" : "Points"}
        <input
          type="number"
          min={0}
          step={1}
          required
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-32 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Expires on (override)
        <input
          type="date"
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Add balance
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
