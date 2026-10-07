"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RedemptionDeleteButton({ id, description }: { id: string; description: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    // Says what it won't do: the balance stays put, since the user may have
    // corrected it since and putting points back would double-count.
    if (!window.confirm("Remove this redemption? Your balance won't be changed back.")) {
      return;
    }

    // Disabled until the request settles, so a double-click can't send two DELETEs.
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/redemptions/${id}`, { method: "DELETE" });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="danger"
      onClick={handleDelete}
      disabled={isDeleting}
      // Every row's button reads "Delete", so name the booking for screen readers.
      aria-label={`Delete redemption: ${description}`}
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </Button>
  );
}
