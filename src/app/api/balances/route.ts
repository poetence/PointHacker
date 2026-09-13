import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { rewardsProgramId, balance, notes, expiresOverrideAt } = body as Record<string, unknown>;

  if (typeof rewardsProgramId !== "string" || rewardsProgramId.length === 0) {
    return NextResponse.json({ error: "rewardsProgramId is required." }, { status: 400 });
  }

  if (typeof balance !== "number" || !Number.isFinite(balance) || !Number.isInteger(balance) || balance < 0) {
    return NextResponse.json(
      { error: "balance must be a non-negative integer." },
      { status: 400 }
    );
  }

  if (notes !== undefined && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }

  let expiresOverrideAtDate: Date | undefined;
  if (expiresOverrideAt !== undefined) {
    if (typeof expiresOverrideAt !== "string") {
      return NextResponse.json({ error: "expiresOverrideAt must be a date string." }, { status: 400 });
    }
    expiresOverrideAtDate = new Date(expiresOverrideAt);
    if (Number.isNaN(expiresOverrideAtDate.getTime())) {
      return NextResponse.json({ error: "expiresOverrideAt must be a valid date." }, { status: 400 });
    }
  }

  const program = await prisma.rewardsProgram.findUnique({ where: { id: rewardsProgramId } });
  if (!program) {
    return NextResponse.json({ error: "rewardsProgramId does not exist." }, { status: 400 });
  }

  try {
    const created = await prisma.pointsBalance.create({
      data: {
        userId,
        rewardsProgramId,
        balance,
        notes,
        expiresOverrideAt: expiresOverrideAtDate,
        lastUpdatedAt: new Date(),
      },
      include: { rewardsProgram: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A balance already exists for this program. Use PATCH to update it." },
        { status: 409 }
      );
    }
    throw error;
  }
}
