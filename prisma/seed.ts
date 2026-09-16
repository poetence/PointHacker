import { PrismaClient } from "@prisma/client";
import {
  referencePrograms,
  referenceTransferPartners,
} from "../src/lib/data/reference-programs";
import { referenceCards } from "../src/lib/data/reference-cards";
import { REFERENCE_CABINS, referenceAwardCosts } from "../src/lib/data/reference-award-costs";

const prisma = new PrismaClient();

async function main() {
  const programIdByName = new Map<string, string>();

  for (const program of referencePrograms) {
    const record = await prisma.rewardsProgram.upsert({
      where: { name: program.name },
      update: {
        shortName: program.shortName,
        type: program.type,
        defaultRedemptionValueCents: program.defaultRedemptionValueCents,
        regions: program.regions ?? [],
        pointsExpirationMonths: program.pointsExpirationMonths ?? null,
        pointsUnit: program.pointsUnit ?? "points",
        notes: program.notes,
      },
      create: {
        name: program.name,
        shortName: program.shortName,
        type: program.type,
        defaultRedemptionValueCents: program.defaultRedemptionValueCents,
        regions: program.regions ?? [],
        pointsExpirationMonths: program.pointsExpirationMonths ?? null,
        pointsUnit: program.pointsUnit ?? "points",
        notes: program.notes,
      },
    });
    programIdByName.set(program.name, record.id);
  }

  for (const partner of referenceTransferPartners) {
    const fromProgramId = programIdByName.get(partner.fromProgram);
    const toProgramId = programIdByName.get(partner.toProgram);
    if (!fromProgramId || !toProgramId) {
      throw new Error(
        `Unknown program in transfer partner: ${partner.fromProgram} -> ${partner.toProgram}`
      );
    }

    await prisma.transferPartner.upsert({
      where: {
        fromProgramId_toProgramId: { fromProgramId, toProgramId },
      },
      update: {
        ratioFrom: partner.ratioFrom,
        ratioTo: partner.ratioTo,
        minimumTransfer: partner.minimumTransfer,
        transferFeeCents: partner.transferFeeCents,
        estimatedRedemptionValueCents: partner.estimatedRedemptionValueCents,
        notes: partner.notes,
      },
      create: {
        fromProgramId,
        toProgramId,
        ratioFrom: partner.ratioFrom,
        ratioTo: partner.ratioTo,
        minimumTransfer: partner.minimumTransfer,
        transferFeeCents: partner.transferFeeCents,
        estimatedRedemptionValueCents: partner.estimatedRedemptionValueCents,
        notes: partner.notes,
      },
    });
  }

  for (const card of referenceCards) {
    const rewardsProgramId = programIdByName.get(card.program);
    if (!rewardsProgramId) {
      throw new Error(`Unknown program for card ${card.issuer} ${card.name}: ${card.program}`);
    }

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

  const regionsByProgramName = new Map(referencePrograms.map((p) => [p.name, p.regions ?? []]));
  let awardCostRows = 0;
  for (const cost of referenceAwardCosts) {
    const rewardsProgramId = programIdByName.get(cost.program);
    if (!rewardsProgramId) {
      throw new Error(`Unknown program in award cost: ${cost.program}`);
    }
    if (!regionsByProgramName.get(cost.program)?.includes(cost.region)) {
      throw new Error(`Award cost for ${cost.program} -> ${cost.region} but the program isn't tagged with that region`);
    }

    for (const cabin of REFERENCE_CABINS) {
      const pointsOneWay = cost.oneWay[cabin];
      if (pointsOneWay === undefined) continue;
      await prisma.awardCost.upsert({
        where: { rewardsProgramId_region_cabin: { rewardsProgramId, region: cost.region, cabin } },
        update: { pointsOneWay, notes: cost.notes },
        create: { rewardsProgramId, region: cost.region, cabin, pointsOneWay, notes: cost.notes },
      });
      awardCostRows += 1;
    }
  }

  console.log(
    `Seeded ${referencePrograms.length} programs, ${referenceTransferPartners.length} transfer partners, ${referenceCards.length} cards, and ${awardCostRows} award costs.`
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
