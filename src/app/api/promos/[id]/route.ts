import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const existing = await prisma.transferBonus.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Promo not found." }, { status: 404 });
  }

  await prisma.transferBonus.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
