import { Heart } from "lucide-react";
import { CoverImage } from "@/components/cover-image";
import type { CollectionWithItems } from "@/db/queries";

interface FavoritesViewProps {
  collection: CollectionWithItems;
}

/** Favorites = a flat, unscored card grid with violet tag accents. */
export function FavoritesView({ collection }: FavoritesViewProps) {
  const items = [...collection.items].sort((a, b) => a.position - b.position);

  if (items.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-foreground">No items yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition duration-200 hover:-translate-y-0.5 hover:border-violet/60 hover:glow-violet"
        >
          <div className="relative">
            <CoverImage
              url={item.imageUrl}
              alt={item.title}
              accent="violet"
              className="h-40 w-full"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
            />
            <span className="absolute left-3 top-3 inline-flex size-7 items-center justify-center rounded-md bg-violet/15 text-violet">
              <Heart className="size-3.5" />
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-4">
            <h3 className="font-display text-base font-semibold leading-tight">
              {item.title}
            </h3>
            {item.note ? (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.note}
              </p>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
