import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "@/lib/user";
import { noContent, notFound, unauthorized } from "@/lib/api-response";

// Promos are shared across users, so any signed-in user may delete one.
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getSessionUserId();
  if (!userId) return unauthorized();

  const existing = await prisma.transferBonus.findUnique({ where: { id } });
  if (!existing) return notFound("Promo");

  await prisma.transferBonus.delete({ where: { id } });

  return noContent();
}
