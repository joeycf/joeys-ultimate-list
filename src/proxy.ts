import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/session";

// Next 16 renamed `middleware` to `proxy` (Node.js runtime by default).
// First line of defense for /admin; the (protected) layout re-checks with
// requireAdmin(), and Phase 5 Server Actions will too.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The login page must stay reachable without a session.
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  if (token && (await verifySession(token))) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};
