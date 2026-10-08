import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseGoalInput } from "@/lib/goals/parse-goal-input";
import { badRequest, unauthorized } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const parsed = parseGoalInput(await request.json().catch(() => null));
  if ("error" in parsed) return badRequest(parsed.error);

  const created = await prisma.awardGoal.create({ data: { userId, ...parsed.input } });

  return NextResponse.json(created, { status: 201 });
}
