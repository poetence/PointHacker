import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseRedemptionInput } from "@/lib/redemptions/parse-redemption-input";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const parsed = parseRedemptionInput(await request.json().catch(() => null));
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { input } = parsed;

  const program = await prisma.rewardsProgram.findUnique({
    where: { id: input.rewardsProgramId },
    select: { id: true },
  });
  if (!program) {
    return NextResponse.json({ error: "rewardsProgramId does not exist." }, { status: 400 });
  }

  // Scoped to this user so one account can't attach a redemption to another's goal.
  if (input.awardGoalId) {
    const goal = await prisma.awardGoal.findFirst({
      where: { id: input.awardGoalId, userId },
      select: { id: true },
    });
    if (!goal) {
      return NextResponse.json({ error: "awardGoalId does not exist." }, { status: 400 });
    }
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

    if (!input.deductFromBalance) {
      return redemption;
    }

    // Spending points the user never tracked is fine — there's just no balance
    // to draw down, so the redemption stands on its own.
    const balance = await tx.pointsBalance.findUnique({
      where: { userId_rewardsProgramId: { userId, rewardsProgramId: input.rewardsProgramId } },
    });
    if (!balance) {
      return redemption;
    }

    const next = Math.max(0, balance.balance - input.pointsSpent);
    if (next !== balance.balance) {
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

    return redemption;
  });

  return NextResponse.json(created, { status: 201 });
}
