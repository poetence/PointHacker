import { NextRequest, NextResponse } from "next/server";
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

  const { cardProductId, nickname, openedOn, notes } = body as Record<string, unknown>;
  let { issuer, productName, rewardsProgramId, annualFeeCents } = body as Record<string, unknown>;

  // Picking from the catalog fills in everything the user would otherwise type.
  if (cardProductId !== undefined) {
    if (typeof cardProductId !== "string" || cardProductId.length === 0) {
      return NextResponse.json({ error: "cardProductId must be a string." }, { status: 400 });
    }
    const product = await prisma.cardProduct.findUnique({ where: { id: cardProductId } });
    if (!product) {
      return NextResponse.json({ error: "cardProductId does not exist." }, { status: 400 });
    }
    issuer = product.issuer;
    productName = product.name;
    rewardsProgramId = product.rewardsProgramId;
    annualFeeCents = annualFeeCents ?? product.annualFeeCents;
  }

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
      userId,
      issuer,
      productName,
      nickname,
      rewardsProgramId,
      cardProductId: typeof cardProductId === "string" ? cardProductId : undefined,
      annualFeeCents,
      openedOn: openedOnDate,
      notes,
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(created, { status: 201 });
}
