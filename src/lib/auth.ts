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
