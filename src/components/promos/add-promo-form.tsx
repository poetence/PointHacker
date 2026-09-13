"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type PromoPartner = {
  id: string;
  fromProgramName: string;
  toProgramName: string;
};

export function AddPromoForm({ partners }: { partners: PromoPartner[] }) {
  const router = useRouter();
  const [transferPartnerId, setTransferPartnerId] = useState(partners[0]?.id ?? "");
  const [bonusPercent, setBonusPercent] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groups = new Map<string, PromoPartner[]>();
  for (const partner of partners) {
    const group = groups.get(partner.fromProgramName) ?? [];
    group.push(partner);
    groups.set(partner.fromProgramName, group);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch("/api/promos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transferPartnerId,
        bonusPercent: Number(bonusPercent),
        startsOn,
        endsOn,
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setBonusPercent("");
    setStartsOn("");
    setEndsOn("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Transfer
        <select
          value={transferPartnerId}
          onChange={(e) => setTransferPartnerId(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {[...groups.entries()].map(([fromName, group]) => (
            <optgroup key={fromName} label={fromName}>
              {group.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {fromName} → {partner.toProgramName}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Bonus %
        <input
          type="number"
          min={1}
          max={500}
          step={1}
          required
          value={bonusPercent}
          onChange={(e) => setBonusPercent(e.target.value)}
          className="w-20 rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Starts
        <input
          type="date"
          required
          value={startsOn}
          onChange={(e) => setStartsOn(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Ends
        <input
          type="date"
          required
          value={endsOn}
          onChange={(e) => setEndsOn(e.target.value)}
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Add promo
      </button>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
