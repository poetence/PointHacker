import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function getSessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** For Server Components: redirects to sign-in if there's no session (defense in depth — middleware already guarantees this). */
export async function requireSessionUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/sign-in");
  }
  return userId;
}
