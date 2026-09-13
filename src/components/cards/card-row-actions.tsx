"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <Input
          size="sm"
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-32"
        />
        <Input
          size="sm"
          type="number"
          min={0}
          step={1}
          placeholder="Fee"
          prefix="$"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
          className="w-24"
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
