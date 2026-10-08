import type { RedemptionOption } from "./compute-best-redemptions";
import { rankRedemptionOptionsForBalances } from "./get-redemption-options";
import { isRegionRelevant, type RegionRelevanceProgramType } from "./region-relevance";

type ProgramRelevanceInfo = { type: RegionRelevanceProgramType; regions: string[] };

/** The best option per balance that's actually usable in `region`, or null if none is. */
export async function getRegionRedemptionOptions(
  balances: { rewardsProgramId: string; balance: number }[],
  region: string
): Promise<Map<string, RedemptionOption | null>> {
  const { programs, transferPartners, optionsByProgramId } =
    await rankRedemptionOptionsForBalances(balances);

  // Relevance is judged on where the points get spent: the program itself for a
  // direct redemption, the partner for a transfer.
  const relevanceById = new Map<string, ProgramRelevanceInfo>([
    ...programs.map((p) => [p.id, { type: p.type, regions: p.regions }] as const),
    ...transferPartners.map(
      (partner) =>
        [partner.toProgram.id, { type: partner.toProgram.type, regions: partner.toProgram.regions }] as const
    ),
  ]);

  const isRelevant = (option: RedemptionOption) => {
    const info = relevanceById.get(option.kind === "direct" ? option.programId : option.partnerProgramId);
    return info ? isRegionRelevant(info, region) : false;
  };

  return new Map([...optionsByProgramId].map(([id, options]) => [id, options?.find(isRelevant) ?? null]));
}
