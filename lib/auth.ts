import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isProtected = nextUrl.pathname.startsWith("/admin");
      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id != null && token.role != null) {
        const ext = session.user as { id: number; role: UserRole };
        ext.id = Number(token.id);
        ext.role = token.role;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const data = credentials as { email: string; password: string } | null;
        const { email, password } = data || {};

        if (!email || !password) {
          throw new InvalidLoginError();
        }

        const user = await prisma.users.findUnique({
          where: { email },
        });
        if (!user) throw new InvalidLoginError();

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
          throw new InvalidLoginError();
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
