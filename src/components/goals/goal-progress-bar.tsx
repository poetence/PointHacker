/** A held/transferable/missing bar for one target program of a goal. */
export function GoalProgressBar({
  heldPoints,
  pointsCovered,
  pointsNeeded,
  label,
  className = "",
}: {
  heldPoints: number;
  pointsCovered: number;
  pointsNeeded: number;
  /** What the bar measures, e.g. "Progress via ANA" — read out before the value. */
  label?: string;
  className?: string;
}) {
  const heldPct = pointsNeeded > 0 ? Math.min(100, (heldPoints / pointsNeeded) * 100) : 0;
  const coveredPct = pointsNeeded > 0 ? Math.min(100, (pointsCovered / pointsNeeded) * 100) : 0;
  const complete = coveredPct >= 100;
  // Without this a screen reader announces only the raw number ("40000").
  const valueText = `${Math.min(pointsCovered, pointsNeeded).toLocaleString("en-US")} of ${pointsNeeded.toLocaleString("en-US")} covered, ${Math.round(coveredPct)}%`;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={pointsNeeded}
      aria-valuenow={Math.min(pointsCovered, pointsNeeded)}
      aria-valuetext={valueText}
      aria-label={label}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${className}`}
    >
      <div
        className={`bar-fill absolute inset-y-0 left-0 rounded-full ${
          complete ? "bg-emerald-500 dark:bg-emerald-400" : "bg-sky-300 dark:bg-sky-700"
        }`}
        style={{ width: `${coveredPct}%` }}
      />
      <div
        className="bar-fill absolute inset-y-0 left-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
        style={{ width: `${heldPct}%`, animationDelay: "120ms" }}
      />
    </div>
  );
}
