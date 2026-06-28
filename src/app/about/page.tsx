import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "About",
  description: "About Joey's Ultimate List — a personal ranking system.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-emerald">
          About
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
          A personal ranking system
        </h1>
        <div className="mt-6 flex flex-col gap-4 leading-relaxed text-muted-foreground">
          <p>
            This is my personal corner of the internet for ranking the things I
            actually care about. Some lists are just <strong>favorites</strong> —
            no scores, just picks I love. Others are <strong>scored</strong>{" "}
            against a rubric I define, then ranked against each other.
          </p>
          <p>
            It&apos;s opinionated on purpose. The point isn&apos;t to be right —
            it&apos;s to have a system, and to argue with it later.
          </p>
          <p className="text-sm text-muted-foreground/60">
            (Placeholder copy — replace with your own.)
          </p>
        </div>
      </main>
    </>
  );
}
