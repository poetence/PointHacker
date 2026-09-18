import { describe, expect, it } from "vitest";
import { isEmailAllowed, parseAllowedEmails } from "./allowed-emails";

describe("parseAllowedEmails", () => {
  it("normalizes case and whitespace and drops blanks", () => {
    expect(parseAllowedEmails(" A@x.com, b@Y.com ,,")).toEqual(new Set(["a@x.com", "b@y.com"]));
    expect(parseAllowedEmails(undefined).size).toBe(0);
  });
});

describe("isEmailAllowed", () => {
  const allowed = parseAllowedEmails("friend@example.com");

  it("lets anyone in when the allowlist is empty", () => {
    expect(isEmailAllowed("anyone@example.com", { allowed: new Set(), owner: undefined })).toBe(true);
  });

  it("enforces the allowlist when set, case-insensitively", () => {
    expect(isEmailAllowed("Friend@Example.com", { allowed, owner: undefined })).toBe(true);
    expect(isEmailAllowed("stranger@example.com", { allowed, owner: undefined })).toBe(false);
  });

  it("always admits the owner and never a missing email", () => {
    expect(isEmailAllowed("owner@example.com", { allowed, owner: "Owner@example.com" })).toBe(true);
    expect(isEmailAllowed(null, { allowed: new Set(), owner: "owner@example.com" })).toBe(false);
  });
});
