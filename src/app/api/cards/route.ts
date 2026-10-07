import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { NOT_A_JSON_OBJECT, badRequest, readJsonObject, unauthorized } from "@/lib/api-response";
import { isNonNegativeInteger, parseOptionalDate } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return badRequest(NOT_A_JSON_OBJECT);

  const { cardProductId, nickname, openedOn, notes } = body;
  let { issuer, productName, rewardsProgramId, annualFeeCents } = body;

  // Picking from the catalog fills in everything the user would otherwise type.
  if (cardProductId !== undefined) {
    if (typeof cardProductId !== "string" || cardProductId.length === 0) {
      return badRequest("cardProductId must be a string.");
    }
    const product = await prisma.cardProduct.findUnique({ where: { id: cardProductId } });
    if (!product) return badRequest("cardProductId does not exist.");

    issuer = product.issuer;
    productName = product.name;
    rewardsProgramId = product.rewardsProgramId;
    annualFeeCents = annualFeeCents ?? product.annualFeeCents;
  }

  if (typeof issuer !== "string" || issuer.length === 0) {
    return badRequest("issuer is required.");
  }
  if (typeof productName !== "string" || productName.length === 0) {
    return badRequest("productName is required.");
  }
  if (typeof rewardsProgramId !== "string" || rewardsProgramId.length === 0) {
    return badRequest("rewardsProgramId is required.");
  }
  if (nickname !== undefined && typeof nickname !== "string") {
    return badRequest("nickname must be a string.");
  }
  if (annualFeeCents !== undefined && !isNonNegativeInteger(annualFeeCents)) {
    return badRequest("annualFeeCents must be a non-negative integer.");
  }
  const opened = parseOptionalDate(openedOn, "openedOn");
  if ("error" in opened) return badRequest(opened.error);
  if (notes !== undefined && typeof notes !== "string") {
    return badRequest("notes must be a string.");
  }

  const program = await prisma.rewardsProgram.findUnique({ where: { id: rewardsProgramId } });
  if (!program) return badRequest("rewardsProgramId does not exist.");

  const created = await prisma.creditCard.create({
    data: {
      userId,
      issuer,
      productName,
      nickname,
      rewardsProgramId,
      cardProductId: typeof cardProductId === "string" ? cardProductId : undefined,
      annualFeeCents,
      openedOn: opened.value,
      notes,
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(created, { status: 201 });
}
