"use client";

import { useState } from "react";
import { sendJson, type SendResult } from "@/lib/send-json";

/**
 * The submit half of every mutation form: clears the last error, flags the
 * request as pending for the button label, sends through `sendJson`, and
 * keeps the route's error message to show. The caller only handles success.
 *
 *   const { submit, isSubmitting, error } = useJsonSubmit();
 *   const result = await submit("/api/promos", "POST", body);
 *   if (result.ok) router.refresh();
 */
export function useJsonSubmit() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit<T = unknown>(
    url: string,
    method: "POST" | "PUT" | "PATCH" | "DELETE",
    body?: unknown
  ): Promise<SendResult<T>> {
    setError(null);
    setIsSubmitting(true);
    const result = await sendJson<T>(url, method, body);
    setIsSubmitting(false);
    if (!result.ok) setError(result.error);
    return result;
  }

  return { submit, isSubmitting, error, setError };
}
