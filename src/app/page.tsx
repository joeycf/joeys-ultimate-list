import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCollections } from "@/db/queries";
import { SiteHeader } from "@/components/site-header";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "favorites", label: "Favorites" },
  { key: "top", label: "Top" },
  { key: "recent", label: "Recent" },
] as const;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>; // Promise in Next 16 — must await
}) {
  const { filter = "all" } = await searchParams;
  const collections = await getPublishedCollections();

  const filtered = collections.filter((c) =>
    filter === "favorites"
      ? c.type === "favorites"
      : filter === "top"
        ? c.type === "top"
        : true
  );

  const totalItems = collections.reduce((n, c) => n + c.items.length, 0);

  return (
    <>
      <SiteHeader />
      <main className="scanlines relative mx-auto w-full max-w-6xl flex-1 px-6 py-12">
        {/* Hero */}
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-emerald">
          Collections
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
          Everything I have opinions about.
        </h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {collections.length} collections
          <span className="px-1.5 text-muted-foreground/40">·</span>
          {totalItems} items
          <span className="px-1.5 text-muted-foreground/40">·</span>
          browse below
        </p>

        {collections.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Nothing here yet."
            description="New collections are on the way. Check back soon."
          />
        ) : (
          <>
            {/* Filters */}
            <div className="mt-8 flex flex-wrap gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <Link
                    key={f.key}
                    href={f.key === "all" ? "/" : `/?filter=${f.key}`}
                    className={cn(
                      "rounded-md border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-colors",
                      active
                        ? "border-emerald/60 bg-emerald/15 text-emerald"
                        : "border-border text-muted-foreground hover:border-emerald/40 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <CollectionCard key={c.id} collection={c} />
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-8"
                title={`No ${filter} collections yet.`}
                description="Try a different filter above."
              />
            )}
          </>
        )}
      </main>
    </>
  );
}
