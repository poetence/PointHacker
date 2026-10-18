import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { parseGoalInput } from "@/lib/goals/parse-goal-input";
import { NOT_A_JSON_OBJECT, badRequest, noContent, notFound, readJsonObject, unauthorized } from "@/lib/api-response";

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

/**
 * Marks a goal booked (`{ booked: true }`) or reopens it (`{ booked: false }`).
 * Separate from PUT because it isn't part of the goal's definition: a booked
 * goal keeps its trip details, it just stops holding points for the others.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.awardGoal.findFirst({ where: { id, userId } });
  if (!existing) return notFound("Goal");

  const body = await readJsonObject(request);
  if (!body) return badRequest(NOT_A_JSON_OBJECT);
  if (typeof body.booked !== "boolean") return badRequest("booked must be a boolean.");

  // Re-marking a booked goal keeps its original date.
  const bookedAt = body.booked ? (existing.bookedAt ?? new Date()) : null;
  const updated = await prisma.awardGoal.update({ where: { id }, data: { bookedAt } });

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
