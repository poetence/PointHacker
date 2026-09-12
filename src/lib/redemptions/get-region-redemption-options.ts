import { prisma } from "@/lib/prisma";
import { computeBestRedemptions, type RedemptionOption } from "./compute-best-redemptions";
import { toRedemptionProgram, toTransferPartnerOption } from "./get-redemption-options";
import { isRegionRelevant, type RegionRelevanceProgramType } from "./region-relevance";

type ProgramRelevanceInfo = { type: RegionRelevanceProgramType; regions: string[] };

export async function getRegionRedemptionOptions(
  balances: { rewardsProgramId: string; balance: number }[],
  region: string
): Promise<Map<string, RedemptionOption | null>> {
  const programIds = balances.map((b) => b.rewardsProgramId);

  const [programs, transferPartners] = await Promise.all([
    prisma.rewardsProgram.findMany({ where: { id: { in: programIds } } }),
    prisma.transferPartner.findMany({
      where: { fromProgramId: { in: programIds }, isActive: true },
      include: { toProgram: true },
    }),
  ]);

  const programsById = new Map(programs.map((p) => [p.id, p]));
  const partnersByFromProgramId = new Map<string, typeof transferPartners>();
  for (const partner of transferPartners) {
    const existing = partnersByFromProgramId.get(partner.fromProgramId) ?? [];
    existing.push(partner);
    partnersByFromProgramId.set(partner.fromProgramId, existing);
  }

  const relevanceById = new Map<string, ProgramRelevanceInfo>();
  for (const program of programs) {
    relevanceById.set(program.id, { type: program.type, regions: program.regions });
  }
  for (const partner of transferPartners) {
    relevanceById.set(partner.toProgram.id, {
      type: partner.toProgram.type,
      regions: partner.toProgram.regions,
    });
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

    const relevantOptions = options.filter((option) => {
      const targetId = option.kind === "direct" ? option.programId : option.partnerProgramId;
      const info = relevanceById.get(targetId);
      return info ? isRegionRelevant(info, region) : false;
    });

    result.set(rewardsProgramId, relevantOptions[0] ?? null);
  }

  return result;
}
