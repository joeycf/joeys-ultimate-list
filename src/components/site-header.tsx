import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/** Shared public top nav (brand + mono links), seen in both mockups. */
export function SiteHeader() {
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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
