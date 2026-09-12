-- CreateEnum
CREATE TYPE "Region" AS ENUM ('NORTH_AMERICA', 'SOUTH_AMERICA', 'EUROPE', 'ASIA', 'AFRICA', 'OCEANIA', 'MIDDLE_EAST', 'CARIBBEAN');

-- AlterTable
ALTER TABLE "RewardsProgram" ADD COLUMN     "regions" "Region"[] DEFAULT ARRAY[]::"Region"[];
