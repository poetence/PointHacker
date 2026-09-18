-- Enable row-level security on every app table with no policies, so Supabase's
-- Data API (PostgREST, reachable with the public anon key) can't read or write
-- them. Prisma connects as the table owner, which is exempt from RLS unless
-- FORCE is set, so the app is unaffected. Also covers Prisma's own
-- _prisma_migrations table.
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AwardCost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AwardGoal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BalanceSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CardProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CreditCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HotelAwardCost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PointsBalance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RewardsProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SpendingProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransferBonus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TransferPartner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
