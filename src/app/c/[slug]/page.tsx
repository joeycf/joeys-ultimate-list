import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionBySlug } from "@/db/queries";
import { SiteHeader } from "@/components/site-header";
import { FavoritesView } from "@/components/favorites-view";
import { TopView } from "@/components/top-view";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Rubric } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return { title: "Not found — Joey's Ultimate List" };
  return {
    title: `${collection.title} — Joey's Ultimate List`,
    description: collection.description ?? undefined,
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>; // Promise in Next 16 — must await
}) {
  const { slug } = await params;

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const isTop = collection.type === "top";
  const rubric = isTop ? ((collection.config as Rubric | null) ?? null) : null;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        {/* Breadcrumb */}
        <nav className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span className="px-1.5 text-muted-foreground/40">/</span>
          <Link
            href={`/?filter=${collection.type}`}
            className="transition-colors hover:text-foreground"
          >
            {collection.type}
          </Link>
          <span className="px-1.5 text-muted-foreground/40">/</span>
          <span className={isTop ? "text-gold" : "text-violet"}>{collection.title}</span>
        </nav>

        {/* Header */}
        <header className="mt-5 flex flex-col gap-3 border-b border-border pb-8">
          <Badge
            variant="outline"
            className={cn(
              "notch-sm w-fit border-transparent font-mono text-[10px] uppercase tracking-widest",
              isTop ? "bg-gold/15 text-gold" : "bg-violet/15 text-violet"
            )}
          >
            {isTop ? "Top" : "Favorites"}
          </Badge>

          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {collection.title}
          </h1>

          {collection.description ? (
            <p className="max-w-2xl text-muted-foreground">{collection.description}</p>
          ) : null}

          {isTop && rubric && rubric.ratings.length > 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Scored on{" "}
              {rubric.ratings.map((c, i) => (
                <span key={c.key}>
                  <span className="text-emerald">{c.label}</span>
                  {i < rubric.ratings.length - 1 ? " · " : ""}
                </span>
              ))}{" "}
              <span className="text-muted-foreground/40">·</span> {rubric.scoreMode}
            </p>
          ) : null}
        </header>

        <div className="mt-8">
          {isTop ? (
            <TopView collection={collection} />
          ) : (
            <FavoritesView collection={collection} />
          )}
        </div>
      </main>
    </>
  );
}
