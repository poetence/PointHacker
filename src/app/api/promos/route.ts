import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }

  const { transferPartnerId, bonusPercent, startsOn, endsOn, notes } = body as Record<string, unknown>;

  if (typeof transferPartnerId !== "string" || transferPartnerId.length === 0) {
    return NextResponse.json({ error: "transferPartnerId is required." }, { status: 400 });
  }

  if (
    typeof bonusPercent !== "number" ||
    !Number.isInteger(bonusPercent) ||
    bonusPercent < 1 ||
    bonusPercent > 500
  ) {
    return NextResponse.json(
      { error: "bonusPercent must be an integer between 1 and 500." },
      { status: 400 }
    );
  }

  if (typeof startsOn !== "string" || typeof endsOn !== "string") {
    return NextResponse.json({ error: "startsOn and endsOn are required date strings." }, { status: 400 });
  }
  const startsOnDate = new Date(startsOn);
  const endsOnDate = new Date(endsOn);
  if (Number.isNaN(startsOnDate.getTime()) || Number.isNaN(endsOnDate.getTime())) {
    return NextResponse.json({ error: "startsOn and endsOn must be valid dates." }, { status: 400 });
  }
  if (endsOnDate < startsOnDate) {
    return NextResponse.json({ error: "endsOn must be on or after startsOn." }, { status: 400 });
  }

  if (notes !== undefined && typeof notes !== "string") {
    return NextResponse.json({ error: "notes must be a string." }, { status: 400 });
  }

  const partner = await prisma.transferPartner.findUnique({ where: { id: transferPartnerId } });
  if (!partner) {
    return NextResponse.json({ error: "transferPartnerId does not exist." }, { status: 400 });
  }

  const created = await prisma.transferBonus.create({
    data: {
      transferPartnerId,
      bonusPercent,
      startsOn: startsOnDate,
      // Make the end date inclusive of the whole day.
      endsOn: new Date(endsOnDate.getTime() + 24 * 60 * 60 * 1000 - 1),
      notes,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
