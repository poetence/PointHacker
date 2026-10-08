import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseRedemptionInput } from "@/lib/redemptions/parse-redemption-input";
import { badRequest, unauthorized } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const parsed = parseRedemptionInput(await request.json().catch(() => null));
  if ("error" in parsed) return badRequest(parsed.error);
  const { input } = parsed;

  const program = await prisma.rewardsProgram.findUnique({
    where: { id: input.rewardsProgramId },
    select: { id: true },
  });
  if (!program) return badRequest("rewardsProgramId does not exist.");

  // Scoped to this user so one account can't attach a redemption to another's goal.
  if (input.awardGoalId) {
    const goal = await prisma.awardGoal.findFirst({
      where: { id: input.awardGoalId, userId },
      select: { id: true },
    });
    if (!goal) return badRequest("awardGoalId does not exist.");
  }

  const created = await prisma.$transaction(async (tx) => {
    const redemption = await tx.redemption.create({
      data: {
        userId,
        rewardsProgramId: input.rewardsProgramId,
        description: input.description,
        pointsSpent: input.pointsSpent,
        cashValueCents: input.cashValueCents,
        feesPaidCents: input.feesPaidCents,
        bookedOn: input.bookedOn,
        awardGoalId: input.awardGoalId,
        notes: input.notes,
      },
      include: { rewardsProgram: true },
    });

    if (input.deductFromBalance) {
      await drawDownBalance(tx, userId, input.rewardsProgramId, input.pointsSpent);
    }
    return redemption;
  });

  return NextResponse.json(created, { status: 201 });
}

/**
 * Takes the spent points off the user's tracked balance, floored at zero.
 * Spending points the user never tracked is fine — there's just no balance to
 * draw down, so the redemption stands on its own.
 */
async function drawDownBalance(
  tx: Prisma.TransactionClient,
  userId: string,
  rewardsProgramId: string,
  pointsSpent: number
) {
  const balance = await tx.pointsBalance.findUnique({
    where: { userId_rewardsProgramId: { userId, rewardsProgramId } },
  });
  if (!balance) return;

  const next = Math.max(0, balance.balance - pointsSpent);
  if (next === balance.balance) return;

  await tx.pointsBalance.update({
    where: { id: balance.id },
    data: {
      balance: next,
      lastUpdatedAt: new Date(),
      // Same invariant as the balances routes: snapshot only on real change.
      snapshots: { create: { balance: next } },
    },
  });
}
