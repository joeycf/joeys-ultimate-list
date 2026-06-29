import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** On-brand empty state: emerald diamond mark + title + optional copy/action. */
export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/40 px-6 py-16 text-center",
        className
      )}
    >
      <span className="size-5 rotate-45 rounded-[4px] bg-emerald/80 shadow-[0_0_22px_var(--color-emerald)]" />
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {description ? (
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
