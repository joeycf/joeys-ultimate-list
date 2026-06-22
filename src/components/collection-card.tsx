import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PlaceholderImage } from "@/components/placeholder-image";
import { cn } from "@/lib/utils";
import type { CollectionWithItems } from "@/db/queries";

/**
 * A clickable Arcade "box you enter" — rounded card + emerald glow on
 * hover. Type tints the badge/edge: top = gold, favorites = violet.
 */
export function CollectionCard({
  collection,
}: {
  collection: CollectionWithItems;
}) {
  const isTop = collection.type === "top";
  const count = collection.items.length;

  return (
    <Link
      href={`/c/${collection.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition duration-200 hover:border-emerald/60 hover:glow focus-visible:border-emerald/60 focus-visible:outline-none"
    >
      <div className="relative">
        <PlaceholderImage accent={isTop ? "gold" : "violet"} className="h-36 w-full" />
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-0.5",
            isTop ? "bg-gold" : "bg-violet"
          )}
        />
        <Badge
          variant="outline"
          className={cn(
            "notch-sm absolute left-3 top-3 border-transparent font-mono text-[10px] uppercase tracking-widest",
            isTop ? "bg-gold/15 text-gold" : "bg-violet/15 text-violet"
          )}
        >
          {isTop ? "Top" : "Favorites"}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight transition-colors group-hover:text-emerald">
          {collection.title}
        </h3>
        {collection.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {collection.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>
            {count} {count === 1 ? "item" : "items"}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald opacity-0 transition-opacity group-hover:opacity-100">
            Enter <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
