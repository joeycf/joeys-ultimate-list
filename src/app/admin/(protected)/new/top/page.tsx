import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Top — Admin",
};

export default function NewTopPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <div className="mt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">
          New · Top
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Top builder — coming in the next step
        </h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          The scored “Top” flow (the rubric builder and the dynamic per-criterion
          item form) is the second pass of Phase&nbsp;5. The favorites flow is
          live now — create one from the dashboard.
        </p>
      </div>
    </div>
  );
}
