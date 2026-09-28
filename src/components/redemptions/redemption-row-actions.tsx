"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RedemptionDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    // Says what it won't do: the balance stays put, since the user may have
    // corrected it since and putting points back would double-count.
    if (!window.confirm("Remove this redemption? Your balance won't be changed back.")) {
      return;
    }

    const response = await fetch(`/api/redemptions/${id}`, { method: "DELETE" });
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
