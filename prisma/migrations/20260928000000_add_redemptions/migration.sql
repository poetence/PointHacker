-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardsProgramId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "cashValueCents" INTEGER NOT NULL,
    "feesPaidCents" INTEGER NOT NULL DEFAULT 0,
    "bookedOn" TIMESTAMP(3) NOT NULL,
    "awardGoalId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Redemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Redemption_userId_bookedOn_idx" ON "Redemption"("userId", "bookedOn");

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_rewardsProgramId_fkey" FOREIGN KEY ("rewardsProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Redemption" ADD CONSTRAINT "Redemption_awardGoalId_fkey" FOREIGN KEY ("awardGoalId") REFERENCES "AwardGoal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Every new table needs row-level security enabled with no policies, or
-- Supabase's public Data API can reach it. See the
-- 20260917000000_enable_row_level_security migration for why.
ALTER TABLE "Redemption" ENABLE ROW LEVEL SECURITY;
