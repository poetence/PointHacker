export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatCentsPerPoint(cents: number): string {
  return `${cents.toFixed(2)}¢`;
}

/** How a program is named in running copy: "Amex MR" rather than "American Express Membership Rewards". */
export function programLabel(program: { name: string; shortName?: string | null }): string {
  return program.shortName ?? program.name;
}
