import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseGoalInput } from "@/lib/goals/parse-goal-input";
import { badRequest, noContent, notFound, unauthorized } from "@/lib/api-response";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.awardGoal.findFirst({ where: { id, userId } });
  if (!existing) return notFound("Goal");

  const parsed = parseGoalInput(await request.json().catch(() => null));
  if ("error" in parsed) return badRequest(parsed.error);

  const updated = await prisma.awardGoal.update({ where: { id }, data: parsed.input });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.awardGoal.findFirst({ where: { id, userId } });
  if (!existing) return notFound("Goal");

  await prisma.awardGoal.delete({ where: { id } });

  return noContent();
}
