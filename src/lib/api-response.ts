import { NextResponse, type NextRequest } from "next/server";

// Every API route answers errors as `{ error }` with a status — the shape
// `sendJson` reads on the client — so they're built here rather than retyped.

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message: string) {
  return jsonError(message, 400);
}

export function unauthorized() {
  return jsonError("Unauthorized.", 401);
}

/** `notFound("Balance")` → 404 "Balance not found." */
export function notFound(thing: string) {
  return jsonError(`${thing} not found.`, 404);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export const NOT_A_JSON_OBJECT = "Request body must be a JSON object.";

/** The request's JSON body if it's an object; null when it's missing, malformed, or a bare value. */
export async function readJsonObject(request: NextRequest): Promise<Record<string, unknown> | null> {
  const body: unknown = await request.json().catch(() => null);
  return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
}
