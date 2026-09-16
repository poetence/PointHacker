/** A held/transferable/missing bar for one target program of a goal. */
export function GoalProgressBar({
  heldPoints,
  pointsCovered,
  pointsNeeded,
  className = "",
}: {
  heldPoints: number;
  pointsCovered: number;
  pointsNeeded: number;
  className?: string;
}) {
  const heldPct = pointsNeeded > 0 ? Math.min(100, (heldPoints / pointsNeeded) * 100) : 0;
  const coveredPct = pointsNeeded > 0 ? Math.min(100, (pointsCovered / pointsNeeded) * 100) : 0;
  const complete = coveredPct >= 100;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={pointsNeeded}
      aria-valuenow={pointsCovered}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${className}`}
    >
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${
          complete ? "bg-emerald-500 dark:bg-emerald-400" : "bg-sky-300 dark:bg-sky-700"
        }`}
        style={{ width: `${coveredPct}%` }}
      />
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
        style={{ width: `${heldPct}%` }}
      />
    </div>
  );
}
