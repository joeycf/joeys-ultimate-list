"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

const SESSION_COOKIE = "session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

type LoginState = { error?: string };

/** Verify the single admin password and set the session cookie. */
export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "Enter your password." };

  if (!process.env.ADMIN_PASSWORD_HASH || !process.env.SESSION_SECRET) {
    return { error: "Admin auth isn't configured yet." };
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  } catch {
    ok = false; // malformed hash, etc. — fail closed, no detail leakage
  }
  if (!ok) return { error: "Wrong password" };

  const token = await createSession();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SEVEN_DAYS,
    // Must be false on http://localhost or the cookie won't be sent in dev.
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/admin"); // outside any try/catch so NEXT_REDIRECT propagates
}

/** Clear the session cookie and return to the login gate. */
export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
