"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CardRowActions({
  id,
  currentNickname,
  currentAnnualFeeCents,
}: {
  id: string;
  currentNickname: string | null;
  currentAnnualFeeCents: number | null;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(currentNickname ?? "");
  const [annualFee, setAnnualFee] = useState(
    currentAnnualFeeCents !== null ? String(currentAnnualFeeCents / 100) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: nickname || null,
        annualFeeCents: annualFee === "" ? null : Math.round(Number(annualFee) * 100),
      }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong.");
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Remove this card?")) return;

    const response = await fetch(`/api/cards/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-28 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          type="number"
          min={0}
          step={0.01}
          placeholder="Annual fee"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
          className="w-24 rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="text-sm font-medium text-zinc-900 underline disabled:opacity-50 dark:text-zinc-100"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-sm text-zinc-500 dark:text-zinc-400"
        >
          Cancel
        </button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button onClick={() => setIsEditing(true)} className="text-zinc-600 underline dark:text-zinc-400">
        Edit
      </button>
      <button onClick={handleDelete} className="text-red-600 dark:text-red-400">
        Delete
      </button>
    </div>
  );
}
