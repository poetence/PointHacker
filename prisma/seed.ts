import { PrismaClient } from "@prisma/client";
import {
  referencePrograms,
  referenceTransferPartners,
} from "../src/lib/data/reference-programs";
import { referenceCards } from "../src/lib/data/reference-cards";
import { REFERENCE_CABINS, referenceAwardCosts } from "../src/lib/data/reference-award-costs";
import {
  REFERENCE_HOTEL_TIERS,
  referenceHotelAwardCosts,
} from "../src/lib/data/reference-hotel-award-costs";

const prisma = new PrismaClient();

type ProgramIds = Map<string, string>;

/** The seeded id for a program named in reference data, or a thrown error naming where it was used. */
function requireProgramId(programIds: ProgramIds, name: string, usedIn: string): string {
  const id = programIds.get(name);
  if (!id) throw new Error(`${usedIn}: ${name}`);
  return id;
}

const regionsByProgramName = new Map<string, readonly string[]>(
  referencePrograms.map((p) => [p.name, p.regions ?? []])
);

/** Award prices are looked up by region, so a price in a region the program isn't tagged with would never be found. */
function assertProgramServesRegion(program: string, region: string, label: string) {
  if (!regionsByProgramName.get(program)?.includes(region)) {
    throw new Error(`${label} for ${program} -> ${region} but the program isn't tagged with that region`);
  }
}

async function seedPrograms(): Promise<ProgramIds> {
  const programIds: ProgramIds = new Map();
  for (const program of referencePrograms) {
    const data = {
      shortName: program.shortName,
      type: program.type,
      defaultRedemptionValueCents: program.defaultRedemptionValueCents,
      regions: program.regions ?? [],
      pointsExpirationMonths: program.pointsExpirationMonths ?? null,
      pointsUnit: program.pointsUnit ?? "points",
      notes: program.notes,
    };
    const record = await prisma.rewardsProgram.upsert({
      where: { name: program.name },
      update: data,
      create: { name: program.name, ...data },
    });
    programIds.set(program.name, record.id);
  }
  return programIds;
}

async function seedTransferPartners(programIds: ProgramIds) {
  for (const partner of referenceTransferPartners) {
    const fromProgramId = programIds.get(partner.fromProgram);
    const toProgramId = programIds.get(partner.toProgram);
    if (!fromProgramId || !toProgramId) {
      throw new Error(
        `Unknown program in transfer partner: ${partner.fromProgram} -> ${partner.toProgram}`
      );
    }

    const data = {
      ratioFrom: partner.ratioFrom,
      ratioTo: partner.ratioTo,
      minimumTransfer: partner.minimumTransfer,
      transferFeeCents: partner.transferFeeCents,
      estimatedRedemptionValueCents: partner.estimatedRedemptionValueCents,
      notes: partner.notes,
    };
    await prisma.transferPartner.upsert({
      where: { fromProgramId_toProgramId: { fromProgramId, toProgramId } },
      update: data,
      create: { fromProgramId, toProgramId, ...data },
    });
  }
}

async function seedCards(programIds: ProgramIds) {
  for (const card of referenceCards) {
    const rewardsProgramId = requireProgramId(
      programIds,
      card.program,
      `Unknown program for card ${card.issuer} ${card.name}`
    );

    const data = {
      rewardsProgramId,
      annualFeeCents: card.annualFeeCents,
      welcomeBonusPoints: card.welcomeBonusPoints ?? null,
      welcomeBonusSpendCents: card.welcomeBonusSpendCents ?? null,
      welcomeBonusMonths: card.welcomeBonusMonths ?? null,
      baseEarnRate: card.baseEarnRate,
      earnRates: card.earnRates ?? {},
      notes: card.notes,
    };
    await prisma.cardProduct.upsert({
      where: { issuer_name: { issuer: card.issuer, name: card.name } },
      update: data,
      create: { issuer: card.issuer, name: card.name, ...data },
    });
  }
}

/** One row per program × region × cabin that has a price. Returns how many were written. */
async function seedFlightAwardCosts(programIds: ProgramIds): Promise<number> {
  let rows = 0;
  for (const cost of referenceAwardCosts) {
    const rewardsProgramId = requireProgramId(programIds, cost.program, "Unknown program in award cost");
    assertProgramServesRegion(cost.program, cost.region, "Award cost");

    for (const cabin of REFERENCE_CABINS) {
      const pointsOneWay = cost.oneWay[cabin];
      if (pointsOneWay === undefined) continue;
      await prisma.awardCost.upsert({
        where: { rewardsProgramId_region_cabin: { rewardsProgramId, region: cost.region, cabin } },
        update: { pointsOneWay, notes: cost.notes },
        create: { rewardsProgramId, region: cost.region, cabin, pointsOneWay, notes: cost.notes },
      });
      rows += 1;
    }
  }
  return rows;
}

/** One row per program × region × tier that has a price. Returns how many were written. */
async function seedHotelAwardCosts(programIds: ProgramIds): Promise<number> {
  let rows = 0;
  for (const cost of referenceHotelAwardCosts) {
    const rewardsProgramId = requireProgramId(programIds, cost.program, "Unknown program in hotel award cost");
    assertProgramServesRegion(cost.program, cost.region, "Hotel award cost");

    for (const tier of REFERENCE_HOTEL_TIERS) {
      const pointsPerNight = cost.perNight[tier];
      if (pointsPerNight === undefined) continue;
      await prisma.hotelAwardCost.upsert({
        where: { rewardsProgramId_region_tier: { rewardsProgramId, region: cost.region, tier } },
        update: { pointsPerNight, notes: cost.notes },
        create: { rewardsProgramId, region: cost.region, tier, pointsPerNight, notes: cost.notes },
      });
      rows += 1;
    }
  }
  return rows;
}

async function main() {
  const programIds = await seedPrograms();
  await seedTransferPartners(programIds);
  await seedCards(programIds);
  const awardCostRows = await seedFlightAwardCosts(programIds);
  const hotelCostRows = await seedHotelAwardCosts(programIds);

  console.log(
    `Seeded ${referencePrograms.length} programs, ${referenceTransferPartners.length} transfer partners, ${referenceCards.length} cards, ${awardCostRows} flight award costs, and ${hotelCostRows} hotel award costs.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
