import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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
        if (passwordsMatch) {
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        throw new InvalidLoginError();
      },
    }),
  ],
});
