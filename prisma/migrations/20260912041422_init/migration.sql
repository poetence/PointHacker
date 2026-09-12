-- CreateEnum
CREATE TYPE "ProgramType" AS ENUM ('BANK_TRANSFERABLE', 'AIRLINE', 'HOTEL', 'CASHBACK', 'OTHER');

-- CreateTable
CREATE TABLE "RewardsProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "type" "ProgramType" NOT NULL,
    "defaultRedemptionValueCents" DECIMAL(6,3) NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardsProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferPartner" (
    "id" TEXT NOT NULL,
    "fromProgramId" TEXT NOT NULL,
    "toProgramId" TEXT NOT NULL,
    "ratioFrom" INTEGER NOT NULL DEFAULT 1,
    "ratioTo" INTEGER NOT NULL DEFAULT 1,
    "minimumTransfer" INTEGER,
    "transferFeeCents" INTEGER,
    "estimatedRedemptionValueCents" DECIMAL(6,3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "issuer" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "nickname" TEXT,
    "rewardsProgramId" TEXT NOT NULL,
    "annualFeeCents" INTEGER,
    "openedOn" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointsBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default-user',
    "rewardsProgramId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "PointsBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RewardsProgram_name_key" ON "RewardsProgram"("name");

-- CreateIndex
CREATE INDEX "TransferPartner_fromProgramId_idx" ON "TransferPartner"("fromProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferPartner_fromProgramId_toProgramId_key" ON "TransferPartner"("fromProgramId", "toProgramId");

-- CreateIndex
CREATE INDEX "CreditCard_userId_idx" ON "CreditCard"("userId");

-- CreateIndex
CREATE INDEX "CreditCard_rewardsProgramId_idx" ON "CreditCard"("rewardsProgramId");

-- CreateIndex
CREATE UNIQUE INDEX "PointsBalance_userId_rewardsProgramId_key" ON "PointsBalance"("userId", "rewardsProgramId");

-- AddForeignKey
ALTER TABLE "TransferPartner" ADD CONSTRAINT "TransferPartner_fromProgramId_fkey" FOREIGN KEY ("fromProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferPartner" ADD CONSTRAINT "TransferPartner_toProgramId_fkey" FOREIGN KEY ("toProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_rewardsProgramId_fkey" FOREIGN KEY ("rewardsProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointsBalance" ADD CONSTRAINT "PointsBalance_rewardsProgramId_fkey" FOREIGN KEY ("rewardsProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
