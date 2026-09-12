import { PrismaClient } from "@prisma/client";
import {
  referencePrograms,
  referenceTransferPartners,
} from "../src/lib/data/reference-programs";

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
        notes: program.notes,
      },
      create: {
        name: program.name,
        shortName: program.shortName,
        type: program.type,
        defaultRedemptionValueCents: program.defaultRedemptionValueCents,
        regions: program.regions ?? [],
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

  console.log(
    `Seeded ${referencePrograms.length} programs and ${referenceTransferPartners.length} transfer partners.`
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
