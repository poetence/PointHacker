// Reframes the card recommender around a goal: for each catalog card, how far
// does its welcome bonus get you toward the trip — landing directly in a target
// program, or transferring in along a partner route (bonus already folded in
// by the caller)? Pure and DB-agnostic.

import {
  receivedFor,
  transferablePoints,
  type GoalTargetPlan,
  type GoalTransferRoute,
} from "./compute-goal-progress";
import { programLabel } from "@/lib/format";

export type GapCard = {
  id: string;
  programId: string;
  welcomeBonusPoints: number | null;
};

export type CardGapContribution = {
  cardId: string;
  /** The program the bonus ends up in. */
  targetProgramId: string;
  targetProgramName: string;
  /** Points landing in the target after any transfer. */
  pointsContributed: number;
  shortfallBefore: number;
  shortfallAfter: number;
  closesGap: boolean;
  /** Set when the bonus reaches the target via a transfer rather than directly. */
  viaTransfer: { activeBonusPercent: number | null } | null;
};

export function closeGapWithCards({
  plans,
  cards,
  transferRoutes,
}: {
  plans: GoalTargetPlan[];
  cards: GapCard[];
  transferRoutes: GoalTransferRoute[];
}): Map<string, CardGapContribution> {
  const openPlans = plans.filter((plan) => plan.shortfall > 0);
  const result = new Map<string, CardGapContribution>();

  for (const card of cards) {
    if (!card.welcomeBonusPoints) continue;

    let best: CardGapContribution | null = null;
    for (const plan of openPlans) {
      const contribution = contributionFor(card, plan, transferRoutes);
      if (contribution && (!best || isBetter(contribution, best, plans))) {
        best = contribution;
      }
    }
    if (best) result.set(card.id, best);
  }

  return result;
}

function contributionFor(
  card: GapCard,
  plan: GoalTargetPlan,
  transferRoutes: GoalTransferRoute[]
): CardGapContribution | null {
  const reach = bonusReachingTarget(card, plan.program.id, transferRoutes);
  if (!reach) return null;

  const { pointsContributed, viaTransfer } = reach;
  const shortfallAfter = Math.max(0, plan.shortfall - pointsContributed);
  return {
    cardId: card.id,
    targetProgramId: plan.program.id,
    targetProgramName: programLabel(plan.program),
    pointsContributed,
    shortfallBefore: plan.shortfall,
    shortfallAfter,
    closesGap: shortfallAfter === 0,
    viaTransfer,
  };
}

/**
 * How much of a card's welcome bonus lands in the target program: all of it
 * when the card earns there, otherwise what a partner route carries over in
 * whole blocks. Null when the bonus can't get there at all.
 */
function bonusReachingTarget(
  card: GapCard,
  targetProgramId: string,
  transferRoutes: GoalTransferRoute[]
): Pick<CardGapContribution, "pointsContributed" | "viaTransfer"> | null {
  const bonus = card.welcomeBonusPoints ?? 0;
  if (card.programId === targetProgramId) {
    return { pointsContributed: bonus, viaTransfer: null };
  }

  const route = transferRoutes.find(
    (r) => r.fromProgramId === card.programId && r.toProgramId === targetProgramId
  );
  if (!route) return null;
  const sendable = transferablePoints(bonus, route);
  if (sendable === 0) return null;

  return {
    pointsContributed: receivedFor(sendable, route),
    viaTransfer: { activeBonusPercent: route.activeBonusPercent ?? null },
  };
}

/** Prefer closing a gap outright (cheapest trip wins), otherwise the smallest remaining gap. */
function isBetter(a: CardGapContribution, b: CardGapContribution, plans: GoalTargetPlan[]): boolean {
  if (a.closesGap !== b.closesGap) return a.closesGap;
  if (a.closesGap) return pointsNeeded(a, plans) < pointsNeeded(b, plans);
  return a.shortfallAfter < b.shortfallAfter;
}

function pointsNeeded(contribution: CardGapContribution, plans: GoalTargetPlan[]): number {
  return plans.find((p) => p.program.id === contribution.targetProgramId)?.pointsNeeded ?? Infinity;
}
