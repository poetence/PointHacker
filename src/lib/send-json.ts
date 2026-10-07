/**
 * The one way client forms call the app's mutation routes.
 *
 * Each form used to inline its own fetch, and none of them caught a thrown
 * fetch (offline, dropped connection), so the submit button stayed disabled
 * with nothing on screen saying why. This never throws: every outcome comes
 * back as a result the form can show.
 */
export type SendResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const NETWORK_ERROR = "Couldn't reach the server. Check your connection and try again.";

export async function sendJson<T = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<SendResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
  } catch {
    return { ok: false, error: NETWORK_ERROR };
  }

  // Routes answer errors as { error }, and a DELETE's 204 has no body at all.
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : null;
    return {
      ok: false,
      error: message ?? `The server couldn't save that (error ${response.status}). Try again.`,
    };
  }

  return { ok: true, data: payload as T };
}
