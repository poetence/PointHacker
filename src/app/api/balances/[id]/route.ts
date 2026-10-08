import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { NOT_A_JSON_OBJECT, badRequest, noContent, notFound, readJsonObject, unauthorized } from "@/lib/api-response";
import { isNonNegativeInteger, parseOptionalDate } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function findOwnedBalance(id: string, userId: string) {
  const record = await prisma.pointsBalance.findUnique({ where: { id } });
  return record?.userId === userId ? record : null;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await findOwnedBalance(id, userId);
  if (!existing) return notFound("Balance");

  const body = await readJsonObject(request);
  if (!body) return badRequest(NOT_A_JSON_OBJECT);

  const { balance, notes, expiresOverrideAt } = body;

  if (balance !== undefined && !isNonNegativeInteger(balance)) {
    return badRequest("balance must be a non-negative integer.");
  }
  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return badRequest("notes must be a string.");
  }
  const expires = parseOptionalDate(expiresOverrideAt, "expiresOverrideAt", { nullable: true });
  if ("error" in expires) return badRequest(expires.error);

  const updated = await prisma.pointsBalance.update({
    where: { id },
    data: {
      ...(balance !== undefined && {
        balance,
        lastUpdatedAt: new Date(),
        ...(balance !== existing.balance && { snapshots: { create: { balance } } }),
      }),
      ...(notes !== undefined && { notes }),
      ...(expires.value !== undefined && { expiresOverrideAt: expires.value }),
    },
    include: { rewardsProgram: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await findOwnedBalance(id, userId);
  if (!existing) return notFound("Balance");

  await prisma.pointsBalance.delete({ where: { id } });

  return noContent();
}
