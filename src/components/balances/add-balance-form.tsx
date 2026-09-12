"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Program = { id: string; name: string; shortName: string | null };

export function AddBalanceForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [rewardsProgramId, setRewardsProgramId] = useState(programs[0]?.id ?? "");
  const [balance, setBalance] = useState("");
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
    setIsSubmitting(true);

    const response = await fetch("/api/balances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardsProgramId, balance: Number(balance) }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setBalance("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Program
        <select
          value={rewardsProgramId}
          onChange={(e) => setRewardsProgramId(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.shortName ?? program.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Balance
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
