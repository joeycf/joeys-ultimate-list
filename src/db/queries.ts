import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { collections, items } from "@/db/schema";

export type Collection = typeof collections.$inferSelect;
export type Item = typeof items.$inferSelect;
export type CollectionWithItems = Collection & { items: Item[] };

// All published reads are wrapped in unstable_cache and tagged "collections"
// so admin Server Actions (Phase 5) can call revalidateTag("collections")
// to refresh the public pages the instant something is saved.

/** Every published collection, with its items. */
export const getPublishedCollections = unstable_cache(
  async (): Promise<CollectionWithItems[]> => {
    return db.query.collections.findMany({
      where: (c, { eq }) => eq(c.published, true),
      with: { items: true },
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });
  },
  ["published-collections"],
  { tags: ["collections"] }
);

/** A single published collection by slug, with its items (or undefined). */
export const getCollectionBySlug = unstable_cache(
  async (slug: string): Promise<CollectionWithItems | undefined> => {
    return db.query.collections.findFirst({
      where: (c, { eq, and }) => and(eq(c.slug, slug), eq(c.published, true)),
      with: { items: true },
    });
  },
  ["collection-by-slug"],
  { tags: ["collections"] }
);
