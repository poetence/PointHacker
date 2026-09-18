// Who may sign in. Pure so it can be tested without Auth.js.

/** Parses a comma-separated list of emails (case-insensitive, whitespace-tolerant). */
export function parseAllowedEmails(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0)
  );
}

/**
 * An empty allowlist means the app is open to any Google account (the pre-allowlist
 * behavior); otherwise the email must be on it. `OWNER_EMAIL` is always allowed.
 */
export function isEmailAllowed(
  email: string | null | undefined,
  { allowed, owner }: { allowed: Set<string>; owner: string | undefined }
): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (owner && normalized === owner.trim().toLowerCase()) return true;
  if (allowed.size === 0) return true;
  return allowed.has(normalized);
}
