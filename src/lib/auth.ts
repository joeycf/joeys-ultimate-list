import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

/**
 * Gate for admin server code. Redirects to the login page unless a valid
 * session cookie is present. Call this in the admin (protected) layout AND
 * inside every admin Server Action — never rely on proxy/middleware alone.
 */
export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get("session")?.value;
  if (!token || !(await verifySession(token))) {
    redirect("/admin/login");
  }
}

/**
 * Non-redirecting sibling of {@link requireAdmin}: returns whether the current
 * request carries a valid admin session. For conditionally rendering admin UI
 * only — NOT a security boundary (mutations still call requireAdmin, and
 * /admin/* stays gated). Reading the cookie opts the caller into dynamic
 * rendering.
 */
export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get("session")?.value;
  return !!token && !!(await verifySession(token));
}
