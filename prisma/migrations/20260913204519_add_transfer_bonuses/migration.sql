-- CreateTable
CREATE TABLE "TransferBonus" (
    "id" TEXT NOT NULL,
    "transferPartnerId" TEXT NOT NULL,
    "bonusPercent" INTEGER NOT NULL,
    "startsOn" TIMESTAMP(3) NOT NULL,
    "endsOn" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferBonus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransferBonus_transferPartnerId_endsOn_idx" ON "TransferBonus"("transferPartnerId", "endsOn");

-- AddForeignKey
ALTER TABLE "TransferBonus" ADD CONSTRAINT "TransferBonus_transferPartnerId_fkey" FOREIGN KEY ("transferPartnerId") REFERENCES "TransferPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
