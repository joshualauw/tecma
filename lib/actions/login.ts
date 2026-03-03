"use server";

import { signIn } from "@/lib/auth";
import type { ApiResponse } from "@/types/ApiResponse";
import { CredentialsSignin } from "next-auth";

type LoginActionResponse = ApiResponse<null>;

export async function loginAction(formData: FormData): Promise<LoginActionResponse> {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true, message: "Login successful" };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { success: false, message: error.code || "Invalid credentials" };
    }
    return { success: false, message: "An unexpected error occurred" };
  }
}
