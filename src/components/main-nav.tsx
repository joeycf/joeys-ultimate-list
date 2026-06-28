"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Favorites/Top are filter shortcuts into the home grid (the home page's own
// pills show the active filter); About is a real route, so it gets the active
// underline. usePathname only — safe in static pages, no Suspense needed.
const ITEMS = [
  { label: "Favorites", href: "/?filter=favorites", route: "/" },
  { label: "Top", href: "/?filter=top", route: "/" },
  { label: "About", href: "/about", route: "/about" },
];

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest">
      {ITEMS.map((item) => {
        const active = item.route !== "/" && pathname === item.route;
        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative px-2 py-1 transition-colors",
              active
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-px bg-emerald" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
