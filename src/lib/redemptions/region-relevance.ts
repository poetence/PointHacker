export type RegionRelevanceProgramType = "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";

export function isRegionRelevant(
  program: { type: RegionRelevanceProgramType; regions: string[] },
  region: string
): boolean {
  if (program.type === "CASHBACK") {
    return true;
  }

  if (program.type === "AIRLINE" || program.type === "HOTEL") {
    return program.regions.includes(region);
  }

  return false;
}
