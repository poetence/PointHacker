"use client";

import { useRouter } from "next/navigation";

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
    <button onClick={handleDelete} className="text-sm text-red-600 dark:text-red-400">
      Delete
    </button>
  );
}
