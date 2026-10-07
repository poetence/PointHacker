import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { NOT_A_JSON_OBJECT, badRequest, noContent, notFound, readJsonObject, unauthorized } from "@/lib/api-response";
import { isNonNegativeInteger, parseOptionalDate } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function findOwnedCard(id: string, userId: string) {
  const record = await prisma.creditCard.findUnique({ where: { id } });
  return record?.userId === userId ? record : null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await findOwnedCard(id, userId);
  if (!existing) return notFound("Card");

  const body = await readJsonObject(request);
  if (!body) return badRequest(NOT_A_JSON_OBJECT);

  const { issuer, productName, nickname, annualFeeCents, openedOn, notes } = body;

  if (issuer !== undefined && (typeof issuer !== "string" || issuer.length === 0)) {
    return badRequest("issuer must be a non-empty string.");
  }
  if (productName !== undefined && (typeof productName !== "string" || productName.length === 0)) {
    return badRequest("productName must be a non-empty string.");
  }
  if (nickname !== undefined && nickname !== null && typeof nickname !== "string") {
    return badRequest("nickname must be a string.");
  }
  if (annualFeeCents !== undefined && annualFeeCents !== null && !isNonNegativeInteger(annualFeeCents)) {
    return badRequest("annualFeeCents must be a non-negative integer.");
  }
  const opened = parseOptionalDate(openedOn, "openedOn", { nullable: true });
  if ("error" in opened) return badRequest(opened.error);
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return badRequest("notes must be a string.");
  }

  const updated = await prisma.creditCard.update({
    where: { id },
    data: {
      ...(issuer !== undefined && { issuer }),
      ...(productName !== undefined && { productName }),
      ...(nickname !== undefined && { nickname }),
      ...(annualFeeCents !== undefined && { annualFeeCents }),
      ...(opened.value !== undefined && { openedOn: opened.value }),
      ...(notes !== undefined && { notes }),
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await findOwnedCard(id, userId);
  if (!existing) return notFound("Card");

  await prisma.creditCard.delete({ where: { id } });

  return noContent();
}
