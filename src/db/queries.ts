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

// ---- Admin reads (uncached, direct DB) ----
// The admin pages must always show the live state, including drafts, so these
// deliberately bypass unstable_cache. Admin routes are dynamic (cookies), so
// they re-run on every request.

/** Every collection (published AND draft), newest first, with items. */
export async function getAllCollections(): Promise<CollectionWithItems[]> {
  return db.query.collections.findMany({
    with: { items: true },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });
}

/** A single collection by id (any status), with items ordered by position. */
export async function getCollectionById(
  id: string
): Promise<CollectionWithItems | undefined> {
  return db.query.collections.findFirst({
    where: (c, { eq }) => eq(c.id, id),
    with: { items: { orderBy: (i, { asc }) => [asc(i.position)] } },
  });
}
