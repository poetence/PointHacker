"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PromoRowActions({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("Remove this promo for everyone?")) return;

    const response = await fetch(`/api/promos/${id}`, { method: "DELETE" });
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
