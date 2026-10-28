"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useInlineEdit } from "@/components/ui/use-inline-edit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJsonSubmit } from "@/components/ui/use-json-submit";
import { FormError } from "@/components/ui/form-error";
import { dollarsToCents, localDateInputValue } from "@/lib/format";

/**
 * The quick actions under a card's welcome bonus: log spend so far, mark the
 * bonus received, or — once the window has closed — say it never came, which
 * clears the bonus so issuer rules don't count it as paid.
 */
export function BonusActions({
  id,
  cardName,
  stage,
  spentCents,
}: {
  id: string;
  cardName: string;
  stage: "in_progress" | "spend_met" | "deadline_passed";
  spentCents: number;
}) {
  const router = useRouter();
  const { isEditing, setIsEditing, editButtonRef, editorRef } = useInlineEdit<HTMLFormElement>();
  const [spent, setSpent] = useState(String(spentCents / 100));
  const { submit, isSubmitting, error } = useJsonSubmit();

  async function save(body: Record<string, unknown>) {
    const result = await submit(`/api/cards/${id}`, "PATCH", body);
    if (!result.ok) return;
    setIsEditing(false);
    router.refresh();
  }

  if (isEditing) {
    return (
      <form
        ref={editorRef}
        onSubmit={(event) => {
          event.preventDefault();
          void save({ bonusSpentCents: dollarsToCents(spent) });
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <Input
          size="sm"
          type="number"
          min={0}
          step={1}
          prefix="$"
          aria-label={`${cardName} spend toward the bonus so far`}
          value={spent}
          onChange={(e) => setSpent(e.target.value)}
          className="w-28"
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
    <div className="flex flex-wrap items-center gap-2">
      {stage === "in_progress" && (
        <Button
          ref={editButtonRef}
          size="sm"
          variant="secondary"
          onClick={() => setIsEditing(true)}
          aria-label={`Update ${cardName} spend toward the bonus`}
        >
          Update spend
        </Button>
      )}
      <Button
        size="sm"
        variant="secondary"
        disabled={isSubmitting}
        onClick={() => save({ bonusReceivedOn: localDateInputValue(new Date()) })}
        aria-label={`Mark the ${cardName} bonus received`}
      >
        {isSubmitting ? "Saving…" : "Got the bonus"}
      </Button>
      {stage === "deadline_passed" && (
        <Button
          size="sm"
          variant="link"
          disabled={isSubmitting}
          onClick={() => save({ bonusPoints: null })}
          aria-label={`The ${cardName} bonus never came`}
        >
          It never came
        </Button>
      )}
      <FormError message={error} />
    </div>
  );
}
