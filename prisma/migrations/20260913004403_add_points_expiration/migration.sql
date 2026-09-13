-- AlterTable
ALTER TABLE "PointsBalance" ADD COLUMN     "expiresOverrideAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RewardsProgram" ADD COLUMN     "pointsExpirationMonths" INTEGER;
