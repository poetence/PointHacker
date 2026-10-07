"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import type { GoalFormValues } from "@/lib/goals/goal-form-values";
import { GoalForm } from "./goal-form";

/** Edit/delete controls for a goal's detail page; the edit form replaces the buttons inline. */
export function GoalActions({ goalId, initial }: { goalId: string; initial: GoalFormValues }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <GoalForm goalId={goalId} initial={initial} onSaved={() => setIsEditing(false)} />
        <Button size="sm" variant="link" onClick={() => setIsEditing(false)} className="self-start">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="secondary" onClick={() => setIsEditing(true)}>
        Edit goal
      </Button>
      <DeleteButton
        url={`/api/goals/${goalId}`}
        itemLabel="this goal"
        confirmMessage="Delete this goal?"
        redirectTo="/goals"
      />
    </div>
  );
}
