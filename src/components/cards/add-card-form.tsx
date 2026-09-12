"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Program = { id: string; name: string; shortName: string | null };

export function AddCardForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [issuer, setIssuer] = useState("");
  const [productName, setProductName] = useState("");
  const [nickname, setNickname] = useState("");
  const [rewardsProgramId, setRewardsProgramId] = useState(programs[0]?.id ?? "");
  const [annualFee, setAnnualFee] = useState("");
  const [openedOn, setOpenedOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (programs.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        No active programs to link a card to yet.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issuer,
        productName,
        nickname: nickname || undefined,
        rewardsProgramId,
        annualFeeCents: annualFee === "" ? undefined : Math.round(Number(annualFee) * 100),
        openedOn: openedOn || undefined,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setIssuer("");
    setProductName("");
    setNickname("");
    setAnnualFee("");
    setOpenedOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Issuer
        <input
          type="text"
          required
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          className="w-32 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Card name
        <input
          type="text"
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-40 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nickname
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-28 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

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
        Annual fee ($)
        <input
          type="number"
          min={0}
          step={0.01}
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
          className="w-24 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Opened
        <input
          type="date"
          value={openedOn}
          onChange={(e) => setOpenedOn(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Add card
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
