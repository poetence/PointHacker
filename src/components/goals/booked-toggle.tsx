"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { useJsonSubmit } from "@/components/ui/use-json-submit";

/**
 * Marks a goal booked, or reopens a booked one. Booking releases the points
 * the goal was holding back, so every other goal is replanned on refresh.
 */
export function BookedToggle({ goalId, booked }: { goalId: string; booked: boolean }) {
  const router = useRouter();
  const { submit, isSubmitting, error } = useJsonSubmit();

  async function handleClick() {
    const result = await submit(`/api/goals/${goalId}`, "PATCH", { booked: !booked });
    if (!result.ok) return;
    router.refresh();
  }

  return (
    <>
      <Button size="sm" variant="secondary" disabled={isSubmitting} onClick={handleClick}>
        {booked
          ? isSubmitting ? "Reopening…" : "Reopen goal"
          : isSubmitting ? "Marking…" : "Mark as booked"}
      </Button>
      <FormError message={error} />
    </>
  );
}
