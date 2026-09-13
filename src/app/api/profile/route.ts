import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";

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

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export async function PUT(request: NextRequest) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;

  const spend: Record<(typeof SPEND_FIELDS)[number], number> = {} as never;
  for (const field of SPEND_FIELDS) {
    if (!isNonNegativeInt(input[field])) {
      return NextResponse.json({ error: `${field} must be a non-negative integer.` }, { status: 400 });
    }
    spend[field] = input[field];
  }

  const { rewardsPreference, maxAnnualFeeCents } = input;
  if (!PREFERENCES.includes(rewardsPreference as (typeof PREFERENCES)[number])) {
    return NextResponse.json(
      { error: `rewardsPreference must be one of ${PREFERENCES.join(", ")}.` },
      { status: 400 }
    );
  }
  if (maxAnnualFeeCents !== null && maxAnnualFeeCents !== undefined && !isNonNegativeInt(maxAnnualFeeCents)) {
    return NextResponse.json({ error: "maxAnnualFeeCents must be a non-negative integer or null." }, { status: 400 });
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
