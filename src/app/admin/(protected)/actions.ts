"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { collectionBasicsSchema, favoriteItemSchema } from "@/lib/validation";

type ActionResult = {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

// Postgres unique_violation backstop (the slug pre-checks below handle the
// friendly path; this catches races).
function isUniqueViolation(e: unknown): boolean {
  const err = e as { code?: string; message?: string };
  return (
    err?.code === "23505" || /duplicate key|unique/i.test(err?.message ?? "")
  );
}

async function slugTaken(slug: string, exceptId?: string): Promise<boolean> {
  const rows = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.slug, slug));
  return rows.some((r) => r.id !== exceptId);
}

/** Trim and collapse empty strings to null for nullable columns. */
function clean(value: string | undefined | null): string | null {
  const t = (value ?? "").trim();
  return t === "" ? null : t;
}

// -------------------------------------------------------------------------
// Collections
// -------------------------------------------------------------------------

export async function createCollection(input: unknown): Promise<ActionResult> {
  await requireAdmin();

  const parsed = collectionBasicsSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  const slug = slugify(data.slug);
  if (!slug) return { fieldErrors: { slug: "Enter a valid slug." } };
  if (await slugTaken(slug)) {
    return { fieldErrors: { slug: "That slug is already taken." } };
  }

  let newId: string;
  try {
    const [row] = await db
      .insert(collections)
      .values({
        slug,
        title: data.title,
        description: clean(data.description),
        type: "favorites",
        config: null,
        published: data.published,
      })
      .returning({ id: collections.id });
    newId = row.id;
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { fieldErrors: { slug: "That slug is already taken." } };
    }
    throw e;
  }

  revalidateTag("collections", "max");
  revalidatePath("/admin");
  return { ok: true, id: newId };
}

export async function updateCollection(
  id: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = collectionBasicsSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  const slug = slugify(data.slug);
  if (!slug) return { fieldErrors: { slug: "Enter a valid slug." } };
  // Uniqueness check EXCLUDES the current row.
  if (await slugTaken(slug, id)) {
    return { fieldErrors: { slug: "That slug is already taken." } };
  }

  try {
    await db
      .update(collections)
      .set({
        slug,
        title: data.title,
        description: clean(data.description),
        published: data.published,
        updatedAt: new Date(),
      })
      .where(eq(collections.id, id));
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { fieldErrors: { slug: "That slug is already taken." } };
    }
    throw e;
  }

  revalidateTag("collections", "max");
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}/edit`);
  return { ok: true };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin();
  // The items FK is ON DELETE cascade, so items go with it.
  await db.delete(collections).where(eq(collections.id, id));

  revalidateTag("collections", "max");
  revalidatePath("/admin");
  return { ok: true };
}

// -------------------------------------------------------------------------
// Favorites items
// -------------------------------------------------------------------------

export async function addItem(
  collectionId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = favoriteItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  // Append at the end.
  const existing = await db
    .select({ position: items.position })
    .from(items)
    .where(eq(items.collectionId, collectionId));
  const nextPosition =
    existing.reduce((max, r) => Math.max(max, r.position), -1) + 1;

  await db.insert(items).values({
    collectionId,
    title: data.title,
    subtitle: clean(data.subtitle),
    imageUrl: clean(data.imageUrl),
    link: clean(data.link),
    note: clean(data.note),
    position: nextPosition,
  });

  revalidateTag("collections", "max");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

export async function updateItem(
  itemId: string,
  collectionId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = favoriteItemSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  await db
    .update(items)
    .set({
      title: data.title,
      subtitle: clean(data.subtitle),
      imageUrl: clean(data.imageUrl),
      link: clean(data.link),
      note: clean(data.note),
    })
    .where(eq(items.id, itemId));

  revalidateTag("collections", "max");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

export async function deleteItem(
  itemId: string,
  collectionId: string
): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(items).where(eq(items.id, itemId));

  revalidateTag("collections", "max");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

async function swapWithNeighbor(
  itemId: string,
  collectionId: string,
  dir: -1 | 1
): Promise<ActionResult> {
  await requireAdmin();

  const list = await db
    .select({ id: items.id, position: items.position })
    .from(items)
    .where(eq(items.collectionId, collectionId))
    .orderBy(asc(items.position));

  const idx = list.findIndex((i) => i.id === itemId);
  if (idx === -1) return { error: "Item not found." };
  const target = idx + dir;
  if (target < 0 || target >= list.length) return { ok: true }; // at an edge

  const a = list[idx];
  const b = list[target];
  // No transactions on neon-http; positions aren't unique-constrained, so two
  // sequential swaps are safe.
  await db.update(items).set({ position: b.position }).where(eq(items.id, a.id));
  await db.update(items).set({ position: a.position }).where(eq(items.id, b.id));

  revalidateTag("collections", "max");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

// These are used as <form action> handlers (reordering buttons), so they
// return void rather than an ActionResult.
export async function moveItemUp(
  itemId: string,
  collectionId: string
): Promise<void> {
  await swapWithNeighbor(itemId, collectionId, -1);
}

export async function moveItemDown(
  itemId: string,
  collectionId: string
): Promise<void> {
  await swapWithNeighbor(itemId, collectionId, 1);
}
