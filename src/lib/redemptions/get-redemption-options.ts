import { prisma } from "@/lib/prisma";
import {
  computeBestRedemptions,
  type RedemptionOption,
  type RedemptionProgram,
  type TransferPartnerOption,
} from "./compute-best-redemptions";
import { applyTransferBonus } from "./transfer-bonus";

export function activeBonusFilter(now: Date) {
  return { where: { startsOn: { lte: now }, endsOn: { gte: now } } };
}

export async function getRedemptionOptionsForProgram(
  rewardsProgramId: string,
  balance: number
): Promise<RedemptionOption[]> {
  const program = await prisma.rewardsProgram.findUniqueOrThrow({
    where: { id: rewardsProgramId },
  });

  const transferPartners = await prisma.transferPartner.findMany({
    where: { fromProgramId: rewardsProgramId, isActive: true },
    include: { toProgram: true, bonuses: activeBonusFilter(new Date()) },
  });

  return computeBestRedemptions({
    program: toRedemptionProgram(program),
    balance,
    transferPartners: transferPartners.map(toTransferPartnerOption),
  });
}

export async function getTopRedemptionOptionsForBalances(
  balances: { rewardsProgramId: string; balance: number }[]
): Promise<Map<string, RedemptionOption | null>> {
  const programIds = balances.map((b) => b.rewardsProgramId);

  const [programs, transferPartners] = await Promise.all([
    prisma.rewardsProgram.findMany({ where: { id: { in: programIds } } }),
    prisma.transferPartner.findMany({
      where: { fromProgramId: { in: programIds }, isActive: true },
      include: { toProgram: true, bonuses: activeBonusFilter(new Date()) },
    }),
  ]);

  const programsById = new Map(programs.map((p) => [p.id, p]));
  const partnersByFromProgramId = new Map<string, typeof transferPartners>();
  for (const partner of transferPartners) {
    const existing = partnersByFromProgramId.get(partner.fromProgramId) ?? [];
    existing.push(partner);
    partnersByFromProgramId.set(partner.fromProgramId, existing);
  }

  const result = new Map<string, RedemptionOption | null>();
  for (const { rewardsProgramId, balance } of balances) {
    const program = programsById.get(rewardsProgramId);
    if (!program) {
      result.set(rewardsProgramId, null);
      continue;
    }

    const options = computeBestRedemptions({
      program: toRedemptionProgram(program),
      balance,
      transferPartners: (partnersByFromProgramId.get(rewardsProgramId) ?? []).map(
        toTransferPartnerOption
      ),
    });

    result.set(rewardsProgramId, options[0] ?? null);
  }

  return result;
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
