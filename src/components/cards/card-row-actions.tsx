"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { sendJson } from "@/lib/send-json";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";

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
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await sendJson(`/api/cards/${id}`, "PATCH", {
      nickname: nickname || null,
      annualFeeCents: annualFee === "" ? null : Math.round(Number(annualFee) * 100),
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
