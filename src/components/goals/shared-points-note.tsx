import { Fragment } from "react";
import Link from "next/link";
import type { GoalRef } from "@/lib/goals/get-goal-progress";
import { percentCovered, type GoalTargetPlan } from "@/lib/goals/compute-goal-progress";
import { programLabel } from "@/lib/format";

/** "Tokyo", "Tokyo and Paris", "Tokyo, Paris and Lisbon" — each a link to the goal. */
export function GoalLinks({ goals }: { goals: GoalRef[] }) {
  return goals.map((goal, index) => (
    <Fragment key={goal.id}>
      {index > 0 && (index === goals.length - 1 ? " and " : ", ")}
      <Link href={`/goals/${goal.id}`} className="font-medium underline underline-offset-2">
        {goal.name}
      </Link>
    </Fragment>
  ));
}

/**
 * Why a goal reads lower than it would on its own: the goals ahead of it in
 * line already spoke for some of the same points. Renders nothing when the
 * goal isn't worse off for sharing.
 */
export function SharedPointsNote({
  standaloneBest,
  squeezedBy,
  className = "text-sm",
}: {
  standaloneBest: GoalTargetPlan | null;
  squeezedBy: GoalRef[];
  className?: string;
}) {
  if (!standaloneBest || squeezedBy.length === 0) return null;

  const alone = standaloneBest.isReachable
    ? `bookable via ${programLabel(standaloneBest.program)}`
    : `${percentCovered(standaloneBest)}% via ${programLabel(standaloneBest.program)}`;

  return (
    <p className={`text-zinc-500 dark:text-zinc-400 ${className}`}>
      On its own: {alone}. <GoalLinks goals={squeezedBy} /> {squeezedBy.length === 1 ? "comes" : "come"}{" "}
      first for some of the same points.
    </p>
  );
}
