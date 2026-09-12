"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function BalanceRowActions({ id, currentBalance }: { id: string; currentBalance: number }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [balance, setBalance] = useState(String(currentBalance));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/balances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: Number(balance) }),
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
    if (!window.confirm("Remove this balance?")) return;

    const response = await fetch(`/api/balances/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
    }
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={1}
          required
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
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
