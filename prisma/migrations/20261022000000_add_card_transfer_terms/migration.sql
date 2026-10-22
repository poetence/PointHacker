-- AlterTable
ALTER TABLE "CardProduct" ADD COLUMN     "soloTransferShare" DECIMAL(3,2) NOT NULL DEFAULT 1,
ADD COLUMN     "transferRatioOverrides" JSONB NOT NULL DEFAULT '{}';
