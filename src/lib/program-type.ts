/**
 * RewardsProgram.type, as a plain union so the pure logic modules and client
 * components can use it without importing Prisma.
 */
export type ProgramType = "BANK_TRANSFERABLE" | "AIRLINE" | "HOTEL" | "CASHBACK" | "OTHER";
