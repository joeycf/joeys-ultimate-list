import { z } from "zod";
import type { Rubric } from "@/lib/types";

// Shared Zod schemas — used by the client (RHF resolver) AND re-validated
// server-side in the Server Actions. Client is UX; server is the source of truth.

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Optional URL field: allows "" (cleared to null server-side) or a valid http(s) URL.
const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), { message: "Enter a valid URL (http(s)://…)" });

export const collectionBasicsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(SLUG_RE, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().max(500),
  coverImage: optionalUrl,
  published: z.boolean(),
});
export type CollectionBasicsInput = z.infer<typeof collectionBasicsSchema>;

export const favoriteItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  subtitle: z.string().trim().max(200),
  imageUrl: optionalUrl,
  link: optionalUrl,
  note: z.string().trim().max(1000),
});
export type FavoriteItemInput = z.infer<typeof favoriteItemSchema>;

// ---- Top: rubric ----

export const criterionSchema = z.object({
  key: z.string().regex(SLUG_RE, "Invalid key"),
  label: z.string().trim().min(1, "Label is required").max(60),
  max: z.coerce.number().int("Whole number").min(1, "Min 1").max(100, "Max 100"),
  weight: z.coerce.number().min(0, "Min 0").max(100, "Max 100"),
});

export const rubricFieldSchema = z.object({
  key: z.string().regex(SLUG_RE, "Invalid key"),
  label: z.string().trim().min(1, "Label is required").max(60),
  type: z.enum(["text", "number", "select"]),
  options: z.array(z.string().trim().min(1)).default([]),
});

export const rubricSchema = z.object({
  ratings: z.array(criterionSchema),
  fields: z.array(rubricFieldSchema),
  scoreMode: z.enum(["sum", "average", "weighted"]),
});
export type RubricInput = z.infer<typeof rubricSchema>;

// ---- Top: items (dynamic, built from the collection's rubric) ----

export const topItemBaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  subtitle: z.string().trim().max(200),
  imageUrl: optionalUrl,
  link: optionalUrl,
});

/**
 * A Zod schema for a top item's full form, generated from the current rubric.
 * Ratings are numbers in 0..max (sliders enforce this client-side; the server
 * clamps again). Field values are collected as strings and coerced server-side.
 */
export function buildTopItemSchema(rubric: Rubric) {
  const ratings: Record<string, z.ZodTypeAny> = {};
  for (const c of rubric.ratings) {
    ratings[c.key] = z.coerce.number().min(0).max(c.max);
  }
  const fieldValues: Record<string, z.ZodTypeAny> = {};
  for (const f of rubric.fields ?? []) {
    fieldValues[f.key] = z.string().trim();
  }
  return topItemBaseSchema.extend({
    ratings: z.object(ratings),
    fieldValues: z.object(fieldValues),
  });
}
