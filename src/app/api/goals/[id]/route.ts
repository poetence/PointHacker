import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseGoalInput } from "@/lib/goals/parse-goal-input";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.awardGoal.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseGoalInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updated = await prisma.awardGoal.update({ where: { id }, data: parsed.input });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.awardGoal.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  await prisma.awardGoal.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
