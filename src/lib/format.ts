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

/** "mile" or "point", for "per …" copy. Any unit other than miles reads as points. */
export function unitSingular(pointsUnit: string): string {
  return pointsUnit === "miles" ? "mile" : "point";
}

/** "Miles" or "Points", for field labels and sentence starts. */
export function unitLabel(pointsUnit: string): string {
  return pointsUnit === "miles" ? "Miles" : "Points";
}

/** A non-zero change with its sign: "+1,500" or "−200" (a true minus sign, not a hyphen). */
export function formatSignedCount(change: number): string {
  return `${change > 0 ? "+" : "−"}${Math.abs(change).toLocaleString("en-US")}`;
}
