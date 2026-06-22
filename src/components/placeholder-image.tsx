import { cn } from "@/lib/utils";

const ACCENT: Record<string, string> = {
  emerald: "var(--color-emerald)",
  violet: "var(--color-violet)",
  gold: "var(--color-gold)",
  muted: "var(--muted-foreground)",
};

/**
 * Diagonal-striped "no image yet" placeholder, tinted by accent.
 * Real images arrive in Phase 7; until then every cover uses this.
 */
export function PlaceholderImage({
  accent = "emerald",
  className,
  label,
}: {
  accent?: "emerald" | "violet" | "gold" | "muted";
  className?: string;
  label?: string;
}) {
  const c = ACCENT[accent] ?? ACCENT.emerald;
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-secondary",
        className
      )}
      style={{
        backgroundImage: `repeating-linear-gradient(135deg, color-mix(in oklab, ${c} 14%, transparent) 0px, color-mix(in oklab, ${c} 14%, transparent) 1.5px, transparent 1.5px, transparent 11px)`,
      }}
    >
      {label ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {label}
        </span>
      ) : null}
    </div>
  );
}
