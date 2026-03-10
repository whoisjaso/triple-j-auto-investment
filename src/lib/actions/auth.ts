"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac } from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "dev-secret-triple-j";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";
const SESSION_MAX_AGE = 86400; // 24 hours in seconds

export type AuthState = {
  success: boolean;
  error?: string;
};

function createToken(): string {
  const timestamp = Date.now().toString();
  const signature = createHmac("sha256", ADMIN_SECRET)
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${signature}`;
}

export async function loginAdmin(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get("password") as string | null;

  if (!password) {
    return { success: false, error: "Password is required." };
  }

  if (password !== ADMIN_PASSWORD) {
    return { success: false, error: "Invalid password." };
  }

  const token = createToken();
  const cookieStore = await cookies();
  cookieStore.set("admin-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("admin-session");
  redirect("/admin/login");
}
