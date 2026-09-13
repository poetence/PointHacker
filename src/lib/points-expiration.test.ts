import { describe, expect, it } from "vitest";
import { getExpirationStatus } from "./points-expiration";

const NOW = new Date("2026-01-01T00:00:00Z");

describe("getExpirationStatus", () => {
  it("never expires when there's no policy and no override", () => {
    const result = getExpirationStatus({
      lastUpdatedAt: new Date("2020-01-01T00:00:00Z"),
      expirationMonths: null,
      overrideAt: null,
      now: NOW,
    });
    expect(result).toEqual({ status: "none", expiresAt: null });
  });

  it("is safe when the computed expiration is well beyond the warning window", () => {
    const result = getExpirationStatus({
      lastUpdatedAt: new Date("2025-12-01T00:00:00Z"),
      expirationMonths: 24,
      overrideAt: null,
      now: NOW,
    });
    expect(result.status).toBe("none");
    expect(result.expiresAt).toEqual(new Date("2027-12-01T00:00:00Z"));
  });

  it("is expiring_soon when the computed date falls within the warning window", () => {
    const result = getExpirationStatus({
      lastUpdatedAt: new Date("2024-01-15T00:00:00Z"),
      expirationMonths: 24,
      overrideAt: null,
      now: NOW,
    });
    expect(result.status).toBe("expiring_soon");
    expect(result.expiresAt).toEqual(new Date("2026-01-15T00:00:00Z"));
  });

  it("is expired when the computed date is in the past", () => {
    const result = getExpirationStatus({
      lastUpdatedAt: new Date("2023-01-01T00:00:00Z"),
      expirationMonths: 12,
      overrideAt: null,
      now: NOW,
    });
    expect(result.status).toBe("expired");
    expect(result.expiresAt).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  it("an override date takes precedence over the computed policy date", () => {
    const result = getExpirationStatus({
      lastUpdatedAt: new Date("2025-12-31T00:00:00Z"),
      expirationMonths: 24,
      overrideAt: new Date("2026-01-10T00:00:00Z"),
      now: NOW,
    });
    expect(result.status).toBe("expiring_soon");
    expect(result.expiresAt).toEqual(new Date("2026-01-10T00:00:00Z"));
  });
});
