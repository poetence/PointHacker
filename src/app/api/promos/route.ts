import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { NOT_A_JSON_OBJECT, badRequest, readJsonObject, unauthorized } from "@/lib/api-response";
import { isIntInRange, toValidDate } from "@/lib/validation";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const body = await readJsonObject(request);
  if (!body) return badRequest(NOT_A_JSON_OBJECT);

  const { transferPartnerId, bonusPercent, startsOn, endsOn, notes } = body;

  if (typeof transferPartnerId !== "string" || transferPartnerId.length === 0) {
    return badRequest("transferPartnerId is required.");
  }
  if (!isIntInRange(bonusPercent, 1, 500)) {
    return badRequest("bonusPercent must be an integer between 1 and 500.");
  }
  if (typeof startsOn !== "string" || typeof endsOn !== "string") {
    return badRequest("startsOn and endsOn are required date strings.");
  }
  const startsOnDate = toValidDate(startsOn);
  const endsOnDate = toValidDate(endsOn);
  if (!startsOnDate || !endsOnDate) {
    return badRequest("startsOn and endsOn must be valid dates.");
  }
  if (endsOnDate < startsOnDate) {
    return badRequest("endsOn must be on or after startsOn.");
  }
  if (notes !== undefined && typeof notes !== "string") {
    return badRequest("notes must be a string.");
  }

  const partner = await prisma.transferPartner.findUnique({ where: { id: transferPartnerId } });
  if (!partner) return badRequest("transferPartnerId does not exist.");

  const created = await prisma.transferBonus.create({
    data: {
      transferPartnerId,
      bonusPercent,
      startsOn: startsOnDate,
      // Make the end date inclusive of the whole day.
      endsOn: new Date(endsOnDate.getTime() + ONE_DAY_MS - 1),
      notes,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
