import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/lib/auth";
import { logout } from "@/app/admin/actions";

/**
 * Shared public top nav (brand + mono links). When the request is an
 * authenticated admin it also shows an Admin link + Log out — a convenience
 * entry point, not a security boundary. Logged-out visitors see it unchanged.
 */
export async function SiteHeader() {
  const admin = await isAdmin();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="size-3.5 rotate-45 rounded-[3px] bg-emerald shadow-[0_0_12px_var(--color-emerald)] transition-shadow group-hover:shadow-[0_0_20px_var(--color-emerald)]" />
          <span className="font-display text-sm font-semibold tracking-tight">
            Joey&apos;s Ultimate List
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <MainNav />
          {admin ? (
            <>
              <Link
                href="/admin"
                className="px-2 py-1 font-mono text-xs uppercase tracking-widest text-emerald/90 transition-colors hover:text-emerald"
              >
                Admin
              </Link>
              <form action={logout}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  Log out
                </Button>
              </form>
            </>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
