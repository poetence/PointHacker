import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { NOT_A_JSON_OBJECT, badRequest, jsonError, readJsonObject, unauthorized } from "@/lib/api-response";
import { isNonNegativeInteger, parseOptionalDate } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return badRequest(NOT_A_JSON_OBJECT);

  const { rewardsProgramId, balance, notes, expiresOverrideAt } = body;

  if (typeof rewardsProgramId !== "string" || rewardsProgramId.length === 0) {
    return badRequest("rewardsProgramId is required.");
  }
  if (!isNonNegativeInteger(balance)) {
    return badRequest("balance must be a non-negative integer.");
  }
  if (notes !== undefined && typeof notes !== "string") {
    return badRequest("notes must be a string.");
  }
  const expires = parseOptionalDate(expiresOverrideAt, "expiresOverrideAt");
  if ("error" in expires) return badRequest(expires.error);

  const program = await prisma.rewardsProgram.findUnique({ where: { id: rewardsProgramId } });
  if (!program) return badRequest("rewardsProgramId does not exist.");

  try {
    const created = await prisma.pointsBalance.create({
      data: {
        userId,
        rewardsProgramId,
        balance,
        notes,
        expiresOverrideAt: expires.value,
        lastUpdatedAt: new Date(),
        snapshots: { create: { balance } },
      },
      include: { rewardsProgram: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("A balance already exists for this program. Use PATCH to update it.", 409);
    }
    throw error;
  }
}
