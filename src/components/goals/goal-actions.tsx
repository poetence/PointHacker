"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GoalFormValues } from "@/lib/goals/goal-form-values";
import { GoalForm } from "./goal-form";

/** Edit/delete controls for a goal's detail page; the edit form replaces the buttons inline. */
export function GoalActions({ goalId, initial }: { goalId: string; initial: GoalFormValues }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this goal?")) return;

    const response = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (response.ok) {
      router.push("/goals");
      router.refresh();
    }
  }

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
      <Button size="sm" variant="danger" onClick={handleDelete}>
        Delete
      </Button>
    </div>
  );
}

/** Just the delete button, for list rows. */
export function GoalDeleteButton({ goalId }: { goalId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Delete this goal?")) return;

    const response = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <Button size="sm" variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  );
}
