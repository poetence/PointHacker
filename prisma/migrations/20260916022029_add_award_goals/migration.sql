-- CreateEnum
CREATE TYPE "AwardCabin" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateTable
CREATE TABLE "AwardCost" (
    "id" TEXT NOT NULL,
    "rewardsProgramId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "cabin" "AwardCabin" NOT NULL,
    "pointsOneWay" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "AwardCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AwardGoal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "cabin" "AwardCabin" NOT NULL DEFAULT 'ECONOMY',
    "travelers" INTEGER NOT NULL DEFAULT 1,
    "roundTrip" BOOLEAN NOT NULL DEFAULT true,
    "targetMonth" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AwardGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AwardCost_region_cabin_idx" ON "AwardCost"("region", "cabin");

-- CreateIndex
CREATE UNIQUE INDEX "AwardCost_rewardsProgramId_region_cabin_key" ON "AwardCost"("rewardsProgramId", "region", "cabin");

-- CreateIndex
CREATE INDEX "AwardGoal_userId_idx" ON "AwardGoal"("userId");

-- AddForeignKey
ALTER TABLE "AwardCost" ADD CONSTRAINT "AwardCost_rewardsProgramId_fkey" FOREIGN KEY ("rewardsProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
