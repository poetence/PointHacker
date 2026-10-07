import { afterEach, describe, expect, it, vi } from "vitest";
import { NETWORK_ERROR, sendJson } from "./send-json";

function stubFetch(impl: () => Promise<Response>) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sendJson", () => {
  it("sends a JSON body and returns the parsed response", async () => {
    const fetchMock = stubFetch(async () => Response.json({ id: "g1" }, { status: 201 }));

    const result = await sendJson<{ id: string }>("/api/goals", "POST", { label: "Tokyo" });

    expect(result).toEqual({ ok: true, data: { id: "g1" } });
    expect(fetchMock).toHaveBeenCalledWith("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Tokyo" }),
    });
  });

  it("sends no body or content type when there's nothing to send", async () => {
    const fetchMock = stubFetch(async () => new Response(null, { status: 204 }));

    const result = await sendJson("/api/goals/g1", "DELETE");

    expect(result).toEqual({ ok: true, data: null });
    expect(fetchMock).toHaveBeenCalledWith("/api/goals/g1", { method: "DELETE" });
  });

  it("surfaces the route's own error message", async () => {
    stubFetch(async () => Response.json({ error: "Goal not found." }, { status: 404 }));

    expect(await sendJson("/api/goals/g1", "DELETE")).toEqual({
      ok: false,
      error: "Goal not found.",
    });
  });

  it("falls back to the status when the error body isn't the usual shape", async () => {
    stubFetch(async () => new Response("<html>Bad gateway</html>", { status: 502 }));

    expect(await sendJson("/api/goals", "POST", {})).toEqual({
      ok: false,
      error: "The server couldn't save that (error 502). Try again.",
    });
  });

  it("turns a thrown fetch into a result instead of throwing", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    expect(await sendJson("/api/goals", "POST", {})).toEqual({ ok: false, error: NETWORK_ERROR });
  });
});
