import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { isEmailAllowed, parseAllowedEmails } from "@/lib/allowed-emails";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  callbacks: {
    // Sign-in is refused (Auth.js redirects to /sign-in?error=AccessDenied) unless the
    // Google account's email is on ALLOWED_EMAILS or is OWNER_EMAIL. Runs before the
    // adapter creates a User row, so refused accounts leave nothing behind.
    signIn({ user }) {
      return isEmailAllowed(user.email, {
        allowed: parseAllowedEmails(process.env.ALLOWED_EMAILS),
        owner: process.env.OWNER_EMAIL,
      });
    },
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
