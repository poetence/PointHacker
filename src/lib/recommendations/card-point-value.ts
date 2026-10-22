// What one of a card's points is worth to this user: its best use, directly or
// through a transfer partner, at the user's own rate where they have one. With
// goals set, a use that can't book any of them counts at a discount — points
// that only reach programs the user isn't travelling with are worth less to
// them, however good those programs' estimates look.
//
// Pure and DB-agnostic — callers map Prisma records into these input shapes.

import type { ProgramType } from "@/lib/program-type";
import type { PersonalRates, ProgramRateStatus } from "@/lib/redemptions/personal-rates";
import { gcd } from "@/lib/redemptions/transfer-bonus";

/**
 * What a use that books none of the user's goals counts for. They're not
 * worthless — the user may travel there one day — but a card is a multi-year
 * bet on the trips they've said they're saving for.
 */
export const OFF_PLAN_VALUE_SHARE = 0.5;

export type Ratio = { ratioFrom: number; ratioTo: number };

export type PointProgram = {
  id: string;
  name: string;
  shortName: string | null;
  type: ProgramType;
  defaultRedemptionValueCents: number;
};

/** A transfer route out of the card's program, at the program's own ratio — no promos. */
export type PointRoute = Ratio & {
  toProgram: PointProgram;
  estimatedRedemptionValueCents: number | null;
};

/** A catalog card's transfer terms. */
export type TransferTermsCard = {
  id: string;
  issuer: string;
  name: string;
  program: { id: string };
  /** Share of each route's ratio the card gets on its own; 0 = no transfers, 1 = full. */
  soloTransferShare: number;
  /** Where the card's ratio differs from the program's, keyed by destination program id. */
  transferRatioOverrides: Record<string, Ratio>;
  routes: PointRoute[];
};

type CardName = { issuer: string; name: string };

export type TransferAccess =
  /** Transfers on its own terms. */
  | { kind: "full" }
  /** Transfers on the terms of full-transfer cards already in the wallet. */
  | { kind: "pooled"; withCards: CardName[] }
  /** Transfers at a share of the usual ratio until pooled with one of `fullCards`. */
  | { kind: "reduced"; share: number; fullCards: CardName[] }
  /** Doesn't transfer until pooled with one of `fullCards`. */
  | { kind: "none"; fullCards: CardName[] };

export type CardTransfers = {
  access: TransferAccess;
  /** Multiplier on the program's ratio for a route; 0 when the card's points can't take it. */
  factor(toProgramId: string): number;
};

/**
 * A card's points pool with every other card the user holds in the same
 * program, so they move on the best terms among this card and the wallet's
 * full-transfer cards — a Freedom Unlimited next to a Sapphire Reserve gets
 * the Reserve's ratios.
 */
export function resolveCardTransfers(
  card: TransferTermsCard,
  catalog: TransferTermsCard[],
  heldCardIds: ReadonlySet<string>
): CardTransfers {
  const fullCards = catalog.filter(
    (other) => other.program.id === card.program.id && other.soloTransferShare >= 1
  );
  const pool = fullCards.filter((other) => other.id !== card.id && heldCardIds.has(other.id));
  const sources = [{ terms: card, share: card.soloTransferShare }, ...pool.map((terms) => ({ terms, share: 1 }))];

  const factor = (toProgramId: string): number =>
    Math.max(
      0,
      ...sources.map(({ terms, share }) => {
        const route = terms.routes.find((r) => r.toProgram.id === toProgramId);
        if (!route) return 0;
        const own = terms.transferRatioOverrides[toProgramId] ?? route;
        return (perPoint(own) / perPoint(route)) * share;
      })
    );

  const names = (cards: TransferTermsCard[]) => cards.map(({ issuer, name }) => ({ issuer, name }));
  let access: TransferAccess;
  if (card.soloTransferShare >= 1) access = { kind: "full" };
  else if (pool.length > 0) access = { kind: "pooled", withCards: names(pool) };
  else if (card.soloTransferShare > 0) {
    access = { kind: "reduced", share: card.soloTransferShare, fullCards: names(fullCards) };
  } else access = { kind: "none", fullCards: names(fullCards) };

  return { access, factor };
}

/** A route's ratio scaled by `factor`, still in whole points (to the nearest percent); null at 0. */
export function scaleRatio<T extends Ratio>(route: T, factor: number): T | null {
  if (factor <= 0) return null;
  if (factor === 1) return route;
  const rawFrom = route.ratioFrom * 100;
  const rawTo = Math.round(route.ratioTo * factor * 100);
  if (rawTo === 0) return null;
  const divisor = gcd(rawFrom, rawTo);
  return { ...route, ratioFrom: rawFrom / divisor, ratioTo: rawTo / divisor };
}

export type PointUse = {
  kind: "direct" | "transfer";
  /** The program the points are finally spent in. */
  program: PointProgram;
  /** Destination points per card point: 1 when direct. */
  pointsPerPoint: number;
  /** What one card point fetches this way. */
  valuePerPointCents: number;
  /** Prices at least one open goal — always true without goals, and for a cash-like direct use. */
  servesGoals: boolean;
  /** `valuePerPointCents`, cut to `OFF_PLAN_VALUE_SHARE` when it books none of the goals. */
  countedCents: number;
  /** Set when the value is the user's own rate in `program`. */
  personalRate: ProgramRateStatus | null;
};

export type CardPointValue = {
  /** The best use's counted value — what the card's points are scored at. */
  centsPerPoint: number;
  best: PointUse;
  /** Every use the card's points can reach, best first. */
  uses: PointUse[];
  access: TransferAccess;
};

/** Only airline and hotel programs book trips; a bank or cashback direct use is cash, good for anything. */
const TRIP_PROGRAM_TYPES: ReadonlySet<ProgramType> = new Set(["AIRLINE", "HOTEL"]);

export function valueCardPoints({
  program,
  routes,
  transfers,
  personalRates,
  goalProgramIds,
}: {
  program: PointProgram;
  routes: PointRoute[];
  transfers: CardTransfers;
  personalRates: PersonalRates;
  /** Programs that price at least one open goal; null when the user has none. */
  goalProgramIds: ReadonlySet<string> | null;
}): CardPointValue {
  const toUse = (
    kind: PointUse["kind"],
    target: PointProgram,
    pointsPerPoint: number,
    estimateCents: number
  ): PointUse => {
    const personalRate = personalRates.get(target.id) ?? null;
    // Same precedence as `personalizePartner`: the user's own rate beats any estimate.
    const valuePerPointCents = pointsPerPoint * (personalRate?.centsPerPoint ?? estimateCents);
    const servesGoals =
      goalProgramIds === null || !TRIP_PROGRAM_TYPES.has(target.type) || goalProgramIds.has(target.id);
    return {
      kind,
      program: target,
      pointsPerPoint,
      valuePerPointCents,
      servesGoals,
      countedCents: servesGoals ? valuePerPointCents : valuePerPointCents * OFF_PLAN_VALUE_SHARE,
      personalRate,
    };
  };

  const direct = toUse("direct", program, 1, program.defaultRedemptionValueCents);
  const viaPartners = routes.flatMap((route) => {
    const ratio = scaleRatio(route, transfers.factor(route.toProgram.id));
    if (!ratio) return [];
    return [
      toUse(
        "transfer",
        route.toProgram,
        perPoint(ratio),
        route.estimatedRedemptionValueCents ?? route.toProgram.defaultRedemptionValueCents
      ),
    ];
  });

  // Ties go to the direct use: no transfer to make.
  const uses = [direct, ...viaPartners].sort(
    (a, b) => b.countedCents - a.countedCents || Number(b.kind === "direct") - Number(a.kind === "direct")
  );
  return { centsPerPoint: uses[0].countedCents, best: uses[0], uses, access: transfers.access };
}

function perPoint({ ratioFrom, ratioTo }: Ratio): number {
  return ratioTo / ratioFrom;
}
