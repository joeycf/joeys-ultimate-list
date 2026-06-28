import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedCollections, getAllCollections } from "@/db/queries";
import { isAdmin } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { CollectionCard } from "@/components/collection-card";
import { EmptyState } from "@/components/empty-state";
import { NewCollectionMenu } from "@/components/admin/new-collection-menu";
import { AdminCardControls } from "@/components/admin/admin-card-controls";
import { deleteCollection } from "@/app/admin/(protected)/actions";
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

  // Admins see ALL collections (incl. drafts) via the uncached read; the public
  // gets only the cached, published-only read. This branch only runs for an
  // authenticated request, so drafts never reach logged-out visitors.
  const admin = await isAdmin();
  const collections = admin
    ? await getAllCollections()
    : await getPublishedCollections();

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
          {admin ? "managing all" : "browse below"}
        </p>

        {collections.length === 0 ? (
          <EmptyState
            className="mt-12"
            title="Nothing here yet."
            description={
              admin
                ? "Create your first collection."
                : "New collections are on the way. Check back soon."
            }
            action={admin ? <NewCollectionMenu /> : undefined}
          />
        ) : (
          <>
            {/* Filters (+ admin New) */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
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
              {admin ? <NewCollectionMenu /> : null}
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="mt-8 grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <div key={c.id} className="group/admin relative h-full">
                    <CollectionCard
                      collection={c}
                      href={
                        admin && !c.published
                          ? `/admin/${c.id}/edit`
                          : `/c/${c.slug}`
                      }
                    />
                    {admin ? (
                      <AdminCardControls
                        id={c.id}
                        title={c.title}
                        isDraft={!c.published}
                        deleteAction={deleteCollection.bind(null, c.id)}
                      />
                    ) : null}
                  </div>
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
