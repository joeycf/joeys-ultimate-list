// Seed script — run with `npm run db:seed` (tsx).
// Loads .env.local first, then builds its own neon client so we don't depend
// on src/db/index.ts reading DATABASE_URL before dotenv has run.
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { inArray } from "drizzle-orm";
import * as schema from "./schema";
import { collections, items } from "./schema";
import { computeScore } from "../lib/score";
import type { Rubric, ItemRatings } from "../lib/types";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — add it to .env.local first.");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

const FAVORITES_SLUG = "favorite-pokemon";
const TOP_SLUG = "best-anime";

// ---- Favorites: "Favorite Pokémon" (flat, unscored) ----
const pokemon: { title: string; note: string }[] = [
  { title: "Gengar", note: "Mischief incarnate — the original ghost-type icon." },
  { title: "Lucario", note: "Aura sense and the cleanest silhouette in the Pokédex." },
  { title: "Snorlax", note: "Naps competitively. A genuine lifestyle role model." },
  { title: "Eevee", note: "One creature, eight futures. Pure potential." },
  { title: "Dragonite", note: "Looks like a friend, hits like a freight train." },
  { title: "Mimikyu", note: "Just wants to be loved. Will haunt you about it." },
];

// ---- Top: "Best Anime" (scored via the rubric in config) ----
const animeRubric: Rubric = {
  ratings: [
    { key: "animation", label: "Animation", max: 10, weight: 1 },
    { key: "story", label: "Story", max: 10, weight: 1 },
    { key: "sound", label: "Sound", max: 10, weight: 1 },
    { key: "enjoyment", label: "Enjoyment", max: 10, weight: 1 },
  ],
  fields: [
    {
      key: "genre",
      label: "Genre",
      type: "select",
      options: ["Action", "Adventure", "Fantasy", "Drama", "Slice of Life", "Thriller"],
    },
  ],
  scoreMode: "average",
};

const anime: {
  title: string;
  subtitle?: string;
  ratings: ItemRatings;
  genre: string;
}[] = [
  {
    title: "Frieren: Beyond Journey's End",
    subtitle: "Sōsō no Frieren",
    ratings: { animation: 10, story: 10, sound: 9, enjoyment: 10 }, // avg 9.75
    genre: "Fantasy",
  },
  {
    title: "Fullmetal Alchemist: Brotherhood",
    ratings: { animation: 9, story: 10, sound: 9, enjoyment: 10 }, // avg 9.5
    genre: "Adventure",
  },
  {
    title: "Vinland Saga",
    ratings: { animation: 9, story: 10, sound: 8, enjoyment: 9 }, // avg 9.0
    genre: "Drama",
  },
  {
    title: "Mob Psycho 100",
    ratings: { animation: 10, story: 8, sound: 8, enjoyment: 9 }, // avg 8.75
    genre: "Action",
  },
  {
    title: "Cowboy Bebop",
    ratings: { animation: 8, story: 8, sound: 10, enjoyment: 8 }, // avg 8.5
    genre: "Action",
  },
];

async function main() {
  console.log("Seeding database…");

  // Idempotent: remove any existing seed collections (cascades to items).
  await db
    .delete(collections)
    .where(inArray(collections.slug, [FAVORITES_SLUG, TOP_SLUG]));

  // Favorites collection + items.
  const [fav] = await db
    .insert(collections)
    .values({
      slug: FAVORITES_SLUG,
      title: "Favorite Pokémon",
      description: "The ones I'd actually carry around. No scores — just vibes.",
      type: "favorites",
      published: true,
    })
    .returning({ id: collections.id });

  await db.insert(items).values(
    pokemon.map((p, i) => ({
      collectionId: fav.id,
      title: p.title,
      note: p.note,
      position: i,
    }))
  );

  // Top collection (stores the rubric in config) + scored items.
  const [top] = await db
    .insert(collections)
    .values({
      slug: TOP_SLUG,
      title: "Best Anime",
      description:
        "Series I've actually finished, scored on a fixed rubric and ranked against each other.",
      type: "top",
      config: animeRubric,
      published: true,
    })
    .returning({ id: collections.id });

  await db.insert(items).values(
    anime.map((a, i) => ({
      collectionId: top.id,
      title: a.title,
      subtitle: a.subtitle ?? null,
      ratings: a.ratings,
      fieldValues: { genre: a.genre },
      score: computeScore(animeRubric, a.ratings), // stored so the DB can sort
      position: i,
    }))
  );

  console.log(
    `✓ Seeded "Favorite Pokémon" (${pokemon.length} items) and "Best Anime" (${anime.length} items).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
