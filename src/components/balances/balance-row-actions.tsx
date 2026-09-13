"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BalanceRowActions({
  id,
  currentBalance,
  currentExpiresOverrideAt,
  pointsUnit,
}: {
  id: string;
  currentBalance: number;
  currentExpiresOverrideAt: Date | null;
  pointsUnit: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [balance, setBalance] = useState(String(currentBalance));
  const [expiresOn, setExpiresOn] = useState(
    currentExpiresOverrideAt ? currentExpiresOverrideAt.toISOString().slice(0, 10) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await fetch(`/api/balances/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance: Number(balance), expiresOverrideAt: expiresOn || null }),
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
      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
        <Input
          size="sm"
          type="number"
          min={0}
          step={1}
          required
          title={pointsUnit === "miles" ? "Miles" : "Points"}
          placeholder={pointsUnit === "miles" ? "Miles" : "Points"}
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-28"
        />
        <Input
          size="sm"
          type="date"
          title="Expires on (override)"
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
          className="w-40"
        />
        <Button size="sm" type="submit" disabled={isSubmitting}>
          Save
        </Button>
        <Button size="sm" variant="link" type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="link" onClick={() => setIsEditing(true)}>
        Edit
      </Button>
      <Button size="sm" variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}
