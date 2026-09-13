import { PrismaClient } from "@prisma/client";
import {
  referencePrograms,
  referenceTransferPartners,
} from "../src/lib/data/reference-programs";
import { referenceCards } from "../src/lib/data/reference-cards";

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

  console.log(
    `Seeded ${referencePrograms.length} programs, ${referenceTransferPartners.length} transfer partners, and ${referenceCards.length} cards.`
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
