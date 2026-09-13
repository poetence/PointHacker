-- AlterTable
ALTER TABLE "CreditCard" ADD COLUMN     "cardProductId" TEXT;

-- AddForeignKey
ALTER TABLE "CreditCard" ADD CONSTRAINT "CreditCard_cardProductId_fkey" FOREIGN KEY ("cardProductId") REFERENCES "CardProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
