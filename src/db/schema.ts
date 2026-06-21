import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const collectionType = pgEnum("collection_type", ["favorites", "top"]);

export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(), // "Best Anime", "Favorite Pokémon"
  description: text("description"),
  type: collectionType("type").notNull(),
  coverImage: text("cover_image"),
  config: jsonb("config"), // rubric (top only); null for favorites
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url"),
  link: text("link"),
  note: text("note"), // favorites blurb
  ratings: jsonb("ratings"), // { animation: 8, ... }  (top only)
  fieldValues: jsonb("field_values"), // { genre: "Action" }    (top only)
  score: doublePrecision("score"), // computed on save        (top only)
  position: integer("position").notNull().default(0), // manual order / tiebreak
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collectionsRelations = relations(collections, ({ many }) => ({
  items: many(items),
}));
export const itemsRelations = relations(items, ({ one }) => ({
  collection: one(collections, {
    fields: [items.collectionId],
    references: [collections.id],
  }),
}));
