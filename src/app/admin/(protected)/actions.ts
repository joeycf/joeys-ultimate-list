"use server";

import { put } from "@vercel/blob";
import { asc, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { db } from "@/db";
import { collections, items } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { computeScore } from "@/lib/score";
import type { Rubric } from "@/lib/types";
import {
  collectionBasicsSchema,
  favoriteItemSchema,
  rubricSchema,
  topItemBaseSchema,
} from "@/lib/validation";

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
// Images (Vercel Blob)
// -------------------------------------------------------------------------

const UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // headroom under Vercel's ~4.5MB body limit

/**
 * Upload an image to the public Blob store from an admin form. Validated
 * server-side (type + size); returns the public blob URL. (>4MB would need a
 * client upload flow — out of scope.)
 */
export async function uploadImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }
  if (!UPLOAD_TYPES.includes(file.type)) {
    return { error: "Use a JPEG, PNG, or WebP image." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: "Image must be 4MB or smaller." };
  }

  try {
    const blob = await put(file.name || "image", file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}

// -------------------------------------------------------------------------
// Collections
// -------------------------------------------------------------------------

export async function createCollection(
  type: "favorites" | "top",
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = collectionBasicsSchema.safeParse(input);
  if (!parsed.success) return { error: "Please fix the highlighted fields." };
  const data = parsed.data;

  const slug = slugify(data.slug);
  if (!slug) return { fieldErrors: { slug: "Enter a valid slug." } };
  if (await slugTaken(slug)) {
    return { fieldErrors: { slug: "That slug is already taken." } };
  }

  // Top collections start with an empty rubric that the builder fills in next.
  const config: Rubric | null =
    type === "top" ? { ratings: [], fields: [], scoreMode: "average" } : null;

  let newId: string;
  try {
    const [row] = await db
      .insert(collections)
      .values({
        slug,
        title: data.title,
        description: clean(data.description),
        coverImage: clean(data.coverImage),
        type,
        config,
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

  updateTag("collections");
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
        coverImage: clean(data.coverImage),
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

  updateTag("collections");
  revalidatePath("/admin");
  revalidatePath(`/admin/${id}/edit`);
  return { ok: true };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  await requireAdmin();
  // The items FK is ON DELETE cascade, so items go with it.
  await db.delete(collections).where(eq(collections.id, id));

  updateTag("collections");
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

  updateTag("collections");
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

  updateTag("collections");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

export async function deleteItem(
  itemId: string,
  collectionId: string
): Promise<ActionResult> {
  await requireAdmin();
  await db.delete(items).where(eq(items.id, itemId));

  updateTag("collections");
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

  updateTag("collections");
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

// -------------------------------------------------------------------------
// Top: rubric + scored items
// -------------------------------------------------------------------------

function clampNum(v: unknown, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// Build the stored ratings/fieldValues for a top item from raw input + rubric.
// Only keys defined in the rubric are kept; missing ratings default to 0;
// each rating is clamped to its criterion's 0..max.
function cleanTopItem(
  rubric: Rubric,
  rawRatings: Record<string, unknown>,
  rawFields: Record<string, unknown>
) {
  const ratings: Record<string, number> = {};
  for (const c of rubric.ratings) {
    ratings[c.key] = clampNum(rawRatings?.[c.key], 0, c.max);
  }
  const fieldValues: Record<string, string | number | null> = {};
  for (const f of rubric.fields ?? []) {
    const raw = rawFields?.[f.key];
    if (raw == null || raw === "") {
      fieldValues[f.key] = null;
    } else if (f.type === "number") {
      const n = Number(raw);
      fieldValues[f.key] = Number.isFinite(n) ? n : null;
    } else if (f.type === "select") {
      const s = String(raw);
      fieldValues[f.key] = f.options?.includes(s) ? s : null;
    } else {
      fieldValues[f.key] = String(raw).trim();
    }
  }
  return { ratings, fieldValues };
}

async function getRubric(collectionId: string): Promise<Rubric | null> {
  const c = await db.query.collections.findFirst({
    where: (col, { eq }) => eq(col.id, collectionId),
  });
  return (c?.config as Rubric | null) ?? null;
}

async function recomputeAll(collectionId: string, rubric: Rubric): Promise<void> {
  const rows = await db
    .select({ id: items.id, ratings: items.ratings })
    .from(items)
    .where(eq(items.collectionId, collectionId));
  for (const row of rows) {
    const score = computeScore(
      rubric,
      (row.ratings as Record<string, number> | null) ?? {}
    );
    await db.update(items).set({ score }).where(eq(items.id, row.id));
  }
}

export async function updateRubric(
  collectionId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = rubricSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please fix the rubric — check labels, maxes and options." };
  }
  const rubric = parsed.data;

  // Structural checks the schema doesn't cover.
  const keys = rubric.ratings.map((c) => c.key);
  if (new Set(keys).size !== keys.length) {
    return { error: "Two criteria share the same key — rename one." };
  }
  for (const f of rubric.fields) {
    if (f.type === "select" && f.options.filter((o) => o.trim()).length === 0) {
      return { error: `Field “${f.label}” is a select but has no options.` };
    }
  }

  await db
    .update(collections)
    .set({ config: rubric, updatedAt: new Date() })
    .where(eq(collections.id, collectionId));

  // Recompute every item's score under the new rubric.
  await recomputeAll(collectionId, rubric);

  updateTag("collections");
  revalidatePath("/admin");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

export async function recomputeCollectionScores(
  collectionId: string
): Promise<ActionResult> {
  await requireAdmin();
  const rubric = await getRubric(collectionId);
  if (!rubric) return { error: "This collection has no rubric." };
  await recomputeAll(collectionId, rubric);

  updateTag("collections");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

export async function addTopItem(
  collectionId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const base = topItemBaseSchema.safeParse(input);
  if (!base.success) return { error: "Please fix the highlighted fields." };

  const rubric = await getRubric(collectionId);
  if (!rubric) return { error: "This collection has no rubric." };

  const raw = input as {
    ratings?: Record<string, unknown>;
    fieldValues?: Record<string, unknown>;
  };
  const { ratings, fieldValues } = cleanTopItem(
    rubric,
    raw.ratings ?? {},
    raw.fieldValues ?? {}
  );
  const score = computeScore(rubric, ratings); // server is the source of truth

  const existing = await db
    .select({ position: items.position })
    .from(items)
    .where(eq(items.collectionId, collectionId));
  const nextPosition =
    existing.reduce((m, r) => Math.max(m, r.position), -1) + 1;

  await db.insert(items).values({
    collectionId,
    title: base.data.title,
    subtitle: clean(base.data.subtitle),
    imageUrl: clean(base.data.imageUrl),
    link: clean(base.data.link),
    ratings,
    fieldValues,
    score,
    position: nextPosition,
  });

  updateTag("collections");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}

export async function updateTopItem(
  itemId: string,
  collectionId: string,
  input: unknown
): Promise<ActionResult> {
  await requireAdmin();

  const base = topItemBaseSchema.safeParse(input);
  if (!base.success) return { error: "Please fix the highlighted fields." };

  const rubric = await getRubric(collectionId);
  if (!rubric) return { error: "This collection has no rubric." };

  const raw = input as {
    ratings?: Record<string, unknown>;
    fieldValues?: Record<string, unknown>;
  };
  const { ratings, fieldValues } = cleanTopItem(
    rubric,
    raw.ratings ?? {},
    raw.fieldValues ?? {}
  );
  const score = computeScore(rubric, ratings);

  await db
    .update(items)
    .set({
      title: base.data.title,
      subtitle: clean(base.data.subtitle),
      imageUrl: clean(base.data.imageUrl),
      link: clean(base.data.link),
      ratings,
      fieldValues,
      score,
    })
    .where(eq(items.id, itemId));

  updateTag("collections");
  revalidatePath(`/admin/${collectionId}/edit`);
  return { ok: true };
}
