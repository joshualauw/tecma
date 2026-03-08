"use server";

import { signIn } from "@/lib/auth";
import type { ApiResponse } from "@/types/ApiResponse";
import { CredentialsSignin } from "next-auth";
import z from "zod";

const loginSchema = z.object({
  email: z.email().min(1),
  password: z.string().min(1),
});

type LoginActionResponse = ApiResponse<null>;

export async function loginAction(formData: FormData): Promise<LoginActionResponse> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    console.error("Login validation failed:", parsed.error);
    return { success: false, message: "Invalid input" };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof CredentialsSignin) {
      return { success: false, message: error.code || "Invalid credentials" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
