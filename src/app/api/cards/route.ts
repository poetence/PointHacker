import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { issuer, productName, nickname, rewardsProgramId, annualFeeCents, openedOn, notes } =
    body as Record<string, unknown>;

  if (typeof issuer !== "string" || issuer.length === 0) {
    return NextResponse.json({ error: "issuer is required." }, { status: 400 });
  }

  if (typeof productName !== "string" || productName.length === 0) {
    return NextResponse.json({ error: "productName is required." }, { status: 400 });
  }

  if (typeof rewardsProgramId !== "string" || rewardsProgramId.length === 0) {
    return NextResponse.json({ error: "rewardsProgramId is required." }, { status: 400 });
  }

  if (nickname !== undefined && typeof nickname !== "string") {
    return NextResponse.json({ error: "nickname must be a string." }, { status: 400 });
  }

  if (
    annualFeeCents !== undefined &&
    (typeof annualFeeCents !== "number" ||
      !Number.isFinite(annualFeeCents) ||
      !Number.isInteger(annualFeeCents) ||
      annualFeeCents < 0)
  ) {
    return NextResponse.json(
      { error: "annualFeeCents must be a non-negative integer." },
      { status: 400 }
    );
  }

  let openedOnDate: Date | undefined;
  if (openedOn !== undefined) {
    if (typeof openedOn !== "string") {
      return NextResponse.json({ error: "openedOn must be a date string." }, { status: 400 });
    }
    openedOnDate = new Date(openedOn);
    if (Number.isNaN(openedOnDate.getTime())) {
      return NextResponse.json({ error: "openedOn must be a valid date." }, { status: 400 });
    }
  }

  if (notes !== undefined && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }

  const program = await prisma.rewardsProgram.findUnique({ where: { id: rewardsProgramId } });
  if (!program) {
    return NextResponse.json({ error: "rewardsProgramId does not exist." }, { status: 400 });
  }

  const created = await prisma.creditCard.create({
    data: {
      userId: DEFAULT_USER_ID,
      issuer,
      productName,
      nickname,
      rewardsProgramId,
      annualFeeCents,
      openedOn: openedOnDate,
      notes,
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(created, { status: 201 });
}
