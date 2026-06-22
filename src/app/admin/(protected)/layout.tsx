import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

// Everything under this route group is gated. The login page lives at
// /admin/login (outside this group) so it stays reachable when logged out.
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="size-3.5 rotate-45 rounded-[3px] bg-emerald shadow-[0_0_12px_var(--color-emerald)]" />
            <span className="font-display text-sm font-semibold tracking-tight">
              Joey&apos;s Ultimate List
            </span>
            <span className="notch-sm bg-emerald/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-emerald">
              Admin
            </span>
          </div>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            View site →
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
