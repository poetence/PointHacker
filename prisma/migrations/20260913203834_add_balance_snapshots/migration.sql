-- CreateTable
CREATE TABLE "BalanceSnapshot" (
    "id" TEXT NOT NULL,
    "pointsBalanceId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BalanceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BalanceSnapshot_pointsBalanceId_recordedAt_idx" ON "BalanceSnapshot"("pointsBalanceId", "recordedAt");

-- AddForeignKey
ALTER TABLE "BalanceSnapshot" ADD CONSTRAINT "BalanceSnapshot_pointsBalanceId_fkey" FOREIGN KEY ("pointsBalanceId") REFERENCES "PointsBalance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one initial snapshot per existing balance so history isn't empty
INSERT INTO "BalanceSnapshot" ("id", "pointsBalanceId", "balance", "recordedAt")
SELECT 'snap_' || "id", "id", "balance", "lastUpdatedAt" FROM "PointsBalance";
