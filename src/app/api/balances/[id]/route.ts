import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";

async function findOwnedBalance(id: string, userId: string) {
  const record = await prisma.pointsBalance.findUnique({ where: { id } });
  if (!record || record.userId !== userId) {
    return null;
  }
  return record;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await findOwnedBalance(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Balance not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { balance, notes, expiresOverrideAt } = body as Record<string, unknown>;

  if (
    balance !== undefined &&
    (typeof balance !== "number" || !Number.isFinite(balance) || !Number.isInteger(balance) || balance < 0)
  ) {
    return NextResponse.json(
      { error: "balance must be a non-negative integer." },
      { status: 400 }
    );
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }

  let expiresOverrideAtDate: Date | null | undefined;
  if (expiresOverrideAt !== undefined) {
    if (expiresOverrideAt === null) {
      expiresOverrideAtDate = null;
    } else if (typeof expiresOverrideAt !== "string") {
      return NextResponse.json({ error: "expiresOverrideAt must be a date string." }, { status: 400 });
    } else {
      expiresOverrideAtDate = new Date(expiresOverrideAt);
      if (Number.isNaN(expiresOverrideAtDate.getTime())) {
        return NextResponse.json({ error: "expiresOverrideAt must be a valid date." }, { status: 400 });
      }
    }
  }

  const updated = await prisma.pointsBalance.update({
    where: { id },
    data: {
      ...(balance !== undefined && { balance, lastUpdatedAt: new Date() }),
      ...(notes !== undefined && { notes }),
      ...(expiresOverrideAt !== undefined && { expiresOverrideAt: expiresOverrideAtDate }),
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await findOwnedBalance(id, userId);
  if (!existing) {
    return NextResponse.json({ error: "Balance not found." }, { status: 404 });
  }

  await prisma.pointsBalance.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
