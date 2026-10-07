"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { sendJson } from "@/lib/send-json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";

export function BalanceRowActions({
  id,
  programName,
  currentBalance,
  currentExpiresOverrideAt,
  pointsUnit,
}: {
  id: string;
  /** Names the row for screen readers, which otherwise hear a column of identical buttons. */
  programName: string;
  currentBalance: number;
  currentExpiresOverrideAt: Date | null;
  pointsUnit: string;
}) {
  const router = useRouter();
  const { isEditing, setIsEditing, editButtonRef, editorRef } = useInlineEdit<HTMLFormElement>();
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

    const result = await sendJson(`/api/balances/${id}`, "PATCH", {
      balance: Number(balance),
      expiresOverrideAt: expiresOn || null,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  if (isEditing) {
    return (
      <form ref={editorRef} onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
        <Input
          size="sm"
          type="number"
          min={0}
          step={1}
          required
          aria-label={`${programName} ${pointsUnit === "miles" ? "miles" : "points"}`}
          placeholder={pointsUnit === "miles" ? "Miles" : "Points"}
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-28"
        />
        <Input
          size="sm"
          type="date"
          aria-label={`${programName} expires on (override)`}
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
          className="w-40"
        />
        <Button size="sm" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="link" type="button" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        ref={editButtonRef}
        size="sm"
        variant="link"
        onClick={() => setIsEditing(true)}
        aria-label={`Edit ${programName} balance`}
      >
        Edit
      </Button>
      <DeleteButton
        url={`/api/balances/${id}`}
        itemLabel={`${programName} balance`}
        confirmMessage="Remove this balance?"
      />
    </div>
  );
}
