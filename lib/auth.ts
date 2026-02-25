import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

class InvalidLoginError extends CredentialsSignin {
  code = "Invalid credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
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

        const [user] = await db.select().from(users).where(eq(users.email, email));
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
