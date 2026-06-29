"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // `false` on the server + first client render, `true` after hydration — the
  // mounted gate without a setState-in-effect (see Rules of React).
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  // Before mount the theme is unknown (SSR) — default to the dark-first icon.
  const isDark = !mounted || resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
