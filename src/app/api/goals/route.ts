import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseGoalInput } from "@/lib/goals/parse-goal-input";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseGoalInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const created = await prisma.awardGoal.create({ data: { userId, ...parsed.input } });

  return NextResponse.json(created, { status: 201 });
}
