"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";
import { dollarsToCents } from "@/lib/format";

export function CardRowActions({
  id,
  cardName,
  currentNickname,
  currentAnnualFeeCents,
}: {
  id: string;
  /** Names the row for screen readers, which otherwise hear a column of identical buttons. */
  cardName: string;
  currentNickname: string | null;
  currentAnnualFeeCents: number | null;
}) {
  const router = useRouter();
  const { isEditing, setIsEditing, editButtonRef, editorRef } = useInlineEdit<HTMLFormElement>();
  const [nickname, setNickname] = useState(currentNickname ?? "");
  const [annualFee, setAnnualFee] = useState(
    currentAnnualFeeCents !== null ? String(currentAnnualFeeCents / 100) : ""
  );
  const { submit, isSubmitting, error } = useJsonSubmit();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    const result = await submit(`/api/cards/${id}`, "PATCH", {
      nickname: nickname || null,
      annualFeeCents: annualFee === "" ? null : dollarsToCents(annualFee),
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
          type="text"
          placeholder="Nickname"
          aria-label={`${cardName} nickname`}
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
          aria-label={`${cardName} annual fee`}
          prefix="$"
          value={annualFee}
          onChange={(e) => setAnnualFee(e.target.value)}
          className="w-24"
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
        aria-label={`Edit ${cardName}`}
      >
        Edit
      </Button>
      <DeleteButton
        url={`/api/cards/${id}`}
        itemLabel={cardName}
        confirmMessage="Remove this card?"
      />
    </div>
  );
}
