import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_USER_ID } from "@/lib/user";

async function findOwnedCard(id: string) {
  const record = await prisma.creditCard.findUnique({ where: { id } });
  if (!record || record.userId !== DEFAULT_USER_ID) {
    return null;
  }
  return record;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await findOwnedCard(id);
  if (!existing) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { issuer, productName, nickname, annualFeeCents, openedOn, notes } =
    body as Record<string, unknown>;

  if (issuer !== undefined && (typeof issuer !== "string" || issuer.length === 0)) {
    return NextResponse.json({ error: "issuer must be a non-empty string." }, { status: 400 });
  }

  if (productName !== undefined && (typeof productName !== "string" || productName.length === 0)) {
    return NextResponse.json(
      { error: "productName must be a non-empty string." },
      { status: 400 }
    );
  }

  if (nickname !== undefined && nickname !== null && typeof nickname !== "string") {
    return NextResponse.json({ error: "nickname must be a string." }, { status: 400 });
  }

  if (
    annualFeeCents !== undefined &&
    annualFeeCents !== null &&
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

  let openedOnDate: Date | null | undefined;
  if (openedOn !== undefined) {
    if (openedOn === null) {
      openedOnDate = null;
    } else if (typeof openedOn !== "string") {
      return NextResponse.json({ error: "openedOn must be a date string." }, { status: 400 });
    } else {
      openedOnDate = new Date(openedOn);
      if (Number.isNaN(openedOnDate.getTime())) {
        return NextResponse.json({ error: "openedOn must be a valid date." }, { status: 400 });
      }
    }
  }

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }

  const updated = await prisma.creditCard.update({
    where: { id },
    data: {
      ...(issuer !== undefined && { issuer }),
      ...(productName !== undefined && { productName }),
      ...(nickname !== undefined && { nickname }),
      ...(annualFeeCents !== undefined && { annualFeeCents }),
      ...(openedOn !== undefined && { openedOn: openedOnDate }),
      ...(notes !== undefined && { notes }),
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const existing = await findOwnedCard(id);
  if (!existing) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  await prisma.creditCard.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
