import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      if (pathname === "/sign-in" || pathname.startsWith("/api/auth")) {
        return true;
      }
      return Boolean(auth?.user);
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.email || user.email !== process.env.OWNER_EMAIL) {
        return;
      }

      await prisma.$transaction([
        prisma.creditCard.updateMany({
          where: { userId: "default-user" },
          data: { userId: user.id! },
        }),
        prisma.pointsBalance.updateMany({
          where: { userId: "default-user" },
          data: { userId: user.id! },
        }),
      ]);
    },
  },
});
