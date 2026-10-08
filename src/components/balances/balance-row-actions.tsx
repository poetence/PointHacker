"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { unitLabel } from "@/lib/format";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";

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
  const { submit, isSubmitting, error } = useJsonSubmit();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    const result = await submit(`/api/balances/${id}`, "PATCH", {
      balance: Number(balance),
      expiresOverrideAt: expiresOn || null,
    });

    if (!result.ok) return;

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
          aria-label={`${programName} ${unitLabel(pointsUnit).toLowerCase()}`}
          placeholder={unitLabel(pointsUnit)}
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
        <FormError message={error} />
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
