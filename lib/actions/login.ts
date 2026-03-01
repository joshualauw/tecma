"use server";

import { signIn } from "@/lib/auth";
import { CredentialsSignin } from "next-auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      return { success: false, error: error.code || "Invalid credentials" };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}
