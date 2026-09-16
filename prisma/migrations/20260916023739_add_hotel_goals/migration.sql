-- CreateEnum
CREATE TYPE "AwardGoalKind" AS ENUM ('FLIGHT', 'HOTEL');

-- CreateEnum
CREATE TYPE "HotelTier" AS ENUM ('STANDARD', 'UPSCALE', 'LUXURY');

-- AlterTable
ALTER TABLE "AwardGoal" ADD COLUMN     "hotelTier" "HotelTier" NOT NULL DEFAULT 'UPSCALE',
ADD COLUMN     "kind" "AwardGoalKind" NOT NULL DEFAULT 'FLIGHT',
ADD COLUMN     "nights" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "rooms" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "HotelAwardCost" (
    "id" TEXT NOT NULL,
    "rewardsProgramId" TEXT NOT NULL,
    "region" "Region" NOT NULL,
    "tier" "HotelTier" NOT NULL,
    "pointsPerNight" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "HotelAwardCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelAwardCost_region_tier_idx" ON "HotelAwardCost"("region", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "HotelAwardCost_rewardsProgramId_region_tier_key" ON "HotelAwardCost"("rewardsProgramId", "region", "tier");

-- AddForeignKey
ALTER TABLE "HotelAwardCost" ADD CONSTRAINT "HotelAwardCost_rewardsProgramId_fkey" FOREIGN KEY ("rewardsProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
