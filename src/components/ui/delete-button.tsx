"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendJson } from "@/lib/send-json";
import { Button } from "@/components/ui/button";

/**
 * Confirm, DELETE, refresh. Every list row's delete goes through this, so each
 * one gets the same three things the per-row copies used to miss: a name for
 * screen readers (rows of identical "Delete" buttons are indistinguishable), a
 * pending state (a double-click sent two DELETEs), and a visible error when it
 * fails (failures used to do nothing at all).
 *
 * `redirectTo` is a path rather than an onDeleted callback so Server
 * Components can render this directly — a function prop can't cross into a
 * client component.
 */
export function DeleteButton({
  url,
  itemLabel,
  confirmMessage,
  redirectTo,
}: {
  url: string;
  /** What's being deleted, read out as "Delete {itemLabel}". */
  itemLabel: string;
  confirmMessage: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(confirmMessage)) return;

    setError(null);
    setIsDeleting(true);
    const result = await sendJson(url, "DELETE");
    setIsDeleting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (redirectTo) router.push(redirectTo);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="danger"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete ${itemLabel}`}
      >
        {isDeleting ? "Deleting…" : "Delete"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </span>
  );
}
