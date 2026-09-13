-- CreateTable
CREATE TABLE "CardProduct" (
    "id" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rewardsProgramId" TEXT NOT NULL,
    "annualFeeCents" INTEGER NOT NULL DEFAULT 0,
    "welcomeBonusPoints" INTEGER,
    "welcomeBonusSpendCents" INTEGER,
    "welcomeBonusMonths" INTEGER,
    "baseEarnRate" DECIMAL(4,2) NOT NULL,
    "earnRates" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CardProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diningCents" INTEGER NOT NULL DEFAULT 0,
    "groceriesCents" INTEGER NOT NULL DEFAULT 0,
    "travelCents" INTEGER NOT NULL DEFAULT 0,
    "gasCents" INTEGER NOT NULL DEFAULT 0,
    "transitCents" INTEGER NOT NULL DEFAULT 0,
    "onlineCents" INTEGER NOT NULL DEFAULT 0,
    "otherCents" INTEGER NOT NULL DEFAULT 0,
    "rewardsPreference" TEXT NOT NULL DEFAULT 'ANY',
    "maxAnnualFeeCents" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpendingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CardProduct_issuer_name_key" ON "CardProduct"("issuer", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SpendingProfile_userId_key" ON "SpendingProfile"("userId");

-- AddForeignKey
ALTER TABLE "CardProduct" ADD CONSTRAINT "CardProduct_rewardsProgramId_fkey" FOREIGN KEY ("rewardsProgramId") REFERENCES "RewardsProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
