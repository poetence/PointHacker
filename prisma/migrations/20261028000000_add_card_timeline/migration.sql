-- AlterTable
ALTER TABLE "CardProduct" ADD COLUMN     "firstYearFeeWaived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "bonusMonths" INTEGER,
ADD COLUMN     "bonusPoints" INTEGER,
ADD COLUMN     "bonusReceivedOn" TIMESTAMP(3),
ADD COLUMN     "bonusSpendCents" INTEGER,
ADD COLUMN     "bonusSpentCents" INTEGER,
ADD COLUMN     "closedOn" TIMESTAMP(3),
ADD COLUMN     "isBusiness" BOOLEAN NOT NULL DEFAULT false;
