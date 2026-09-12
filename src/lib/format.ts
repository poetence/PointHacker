export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatCentsPerPoint(cents: number): string {
  return `${cents.toFixed(2)}¢`;
}
