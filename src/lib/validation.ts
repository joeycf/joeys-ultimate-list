import { z } from "zod";

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
