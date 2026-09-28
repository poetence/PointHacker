import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";

/**
 * Removes the log entry only. Any balance the redemption drew down stays where
 * it is — the user may well have corrected it since, and silently adding points
 * back would double-count. The UI says as much next to the delete.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.redemption.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ error: "Redemption not found." }, { status: 404 });
  }

  await prisma.redemption.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
