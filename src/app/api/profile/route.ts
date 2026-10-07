import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { NOT_A_JSON_OBJECT, badRequest, readJsonObject, unauthorized } from "@/lib/api-response";
import { isNonNegativeInteger } from "@/lib/validation";

const SPEND_FIELDS = [
  "diningCents",
  "groceriesCents",
  "travelCents",
  "gasCents",
  "transitCents",
  "onlineCents",
  "otherCents",
] as const;

const PREFERENCES = ["ANY", "TRAVEL", "CASHBACK"] as const;

export async function PUT(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const input = await readJsonObject(request);
  if (!input) return badRequest(NOT_A_JSON_OBJECT);

  const spend = {} as Record<(typeof SPEND_FIELDS)[number], number>;
  for (const field of SPEND_FIELDS) {
    const cents = input[field];
    if (!isNonNegativeInteger(cents)) {
      return badRequest(`${field} must be a non-negative integer.`);
    }
    spend[field] = cents;
  }

  const { rewardsPreference, maxAnnualFeeCents } = input;
  if (!PREFERENCES.includes(rewardsPreference as (typeof PREFERENCES)[number])) {
    return badRequest(`rewardsPreference must be one of ${PREFERENCES.join(", ")}.`);
  }
  if (maxAnnualFeeCents !== null && maxAnnualFeeCents !== undefined && !isNonNegativeInteger(maxAnnualFeeCents)) {
    return badRequest("maxAnnualFeeCents must be a non-negative integer or null.");
  }

  const data = {
    ...spend,
    rewardsPreference: rewardsPreference as string,
    maxAnnualFeeCents: maxAnnualFeeCents ?? null,
  };

  const profile = await prisma.spendingProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return NextResponse.json(profile);
}
