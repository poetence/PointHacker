import { prisma } from "@/lib/prisma";
import { groupBy } from "@/lib/group-by";
import {
  computeBestRedemptions,
  type RedemptionOption,
  type RedemptionProgram,
  type TransferPartnerOption,
} from "./compute-best-redemptions";
import { applyTransferBonus } from "./transfer-bonus";
import { personalizePartner, personalizeProgram, type PersonalRates } from "./personal-rates";

export function activeBonusFilter(now: Date) {
  return { where: { startsOn: { lte: now }, endsOn: { gte: now } } };
}

/** `personalRates` (from `getPersonalRates`) stand in for the program's estimates where the user has their own. */
export async function getRedemptionOptionsForProgram(
  rewardsProgramId: string,
  balance: number,
  personalRates: PersonalRates
): Promise<RedemptionOption[]> {
  const program = await prisma.rewardsProgram.findUniqueOrThrow({
    where: { id: rewardsProgramId },
  });

  const transferPartners = await prisma.transferPartner.findMany({
    where: { fromProgramId: rewardsProgramId, isActive: true },
    include: { toProgram: true, bonuses: activeBonusFilter(new Date()) },
  });

  return computeBestRedemptions({
    program: personalizeProgram(toRedemptionProgram(program), personalRates),
    balance,
    transferPartners: transferPartners.map((partner) =>
      personalizePartner(toTransferPartnerOption(partner), personalRates)
    ),
  });
}

/**
 * Every option for each balance, best first, from one round of queries — or
 * null where the program no longer exists. The fetched programs and partners
 * come back too, for callers that filter on more than the ranking.
 */
export async function rankRedemptionOptionsForBalances(
  balances: { rewardsProgramId: string; balance: number }[],
  personalRates: PersonalRates
) {
  const programIds = balances.map((b) => b.rewardsProgramId);

  const [programs, transferPartners] = await Promise.all([
    prisma.rewardsProgram.findMany({ where: { id: { in: programIds } } }),
    prisma.transferPartner.findMany({
      where: { fromProgramId: { in: programIds }, isActive: true },
      include: { toProgram: true, bonuses: activeBonusFilter(new Date()) },
    }),
  ]);

  const programsById = new Map(programs.map((p) => [p.id, p]));
  const partnersByFromProgramId = groupBy(transferPartners, (partner) => partner.fromProgramId);

  const optionsByProgramId = new Map<string, RedemptionOption[] | null>();
  for (const { rewardsProgramId, balance } of balances) {
    const program = programsById.get(rewardsProgramId);
    optionsByProgramId.set(
      rewardsProgramId,
      program
        ? computeBestRedemptions({
            program: personalizeProgram(toRedemptionProgram(program), personalRates),
            balance,
            transferPartners: (partnersByFromProgramId.get(rewardsProgramId) ?? []).map((partner) =>
              personalizePartner(toTransferPartnerOption(partner), personalRates)
            ),
          })
        : null
    );
  }

  return { programs, transferPartners, optionsByProgramId };
}

/** The single best option per balance, for the dashboard's "top pick". */
export async function getTopRedemptionOptionsForBalances(
  balances: { rewardsProgramId: string; balance: number }[],
  personalRates: PersonalRates
): Promise<Map<string, RedemptionOption | null>> {
  const { optionsByProgramId } = await rankRedemptionOptionsForBalances(balances, personalRates);
  return new Map([...optionsByProgramId].map(([id, options]) => [id, options?.[0] ?? null]));
}

export function toRedemptionProgram(program: {
  id: string;
  name: string;
  defaultRedemptionValueCents: { toNumber(): number };
}): RedemptionProgram {
  return {
    id: program.id,
    name: program.name,
    defaultRedemptionValueCents: program.defaultRedemptionValueCents.toNumber(),
  };
}

export function toTransferPartnerOption(partner: {
  toProgram: {
    id: string;
    name: string;
    defaultRedemptionValueCents: { toNumber(): number };
  };
  ratioFrom: number;
  ratioTo: number;
  minimumTransfer: number | null;
  transferFeeCents: number | null;
  estimatedRedemptionValueCents: { toNumber(): number } | null;
  bonuses?: { bonusPercent: number }[];
}): TransferPartnerOption {
  const base: TransferPartnerOption = {
    toProgram: toRedemptionProgram(partner.toProgram),
    ratioFrom: partner.ratioFrom,
    ratioTo: partner.ratioTo,
    minimumTransfer: partner.minimumTransfer,
    transferFeeCents: partner.transferFeeCents,
    estimatedRedemptionValueCents: partner.estimatedRedemptionValueCents?.toNumber() ?? null,
  };

  const bestBonus = Math.max(0, ...(partner.bonuses ?? []).map((b) => b.bonusPercent));
  return applyTransferBonus(base, bestBonus);
}
