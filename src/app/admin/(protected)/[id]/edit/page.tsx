import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronUp, ExternalLink, Plus } from "lucide-react";

import { getCollectionById } from "@/db/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CollectionBasicsForm } from "@/components/admin/collection-basics-form";
import { ItemFormDialog } from "@/components/admin/item-form-dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  addItem,
  deleteItem,
  moveItemDown,
  moveItemUp,
  updateCollection,
  updateItem,
} from "../../actions";

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>; // async in Next 16
}) {
  const { id } = await params;
  const collection = await getCollectionById(id);
  if (!collection) notFound();

  const isTop = collection.type === "top";
  const items = collection.items;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/admin"
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Dashboard
          </Link>
          {collection.published ? (
            <Link
              href={`/c/${collection.slug}`}
              className="font-mono text-[11px] uppercase tracking-widest text-emerald transition-colors hover:text-foreground"
            >
              View public page →
            </Link>
          ) : null}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {collection.title}
          </h1>
          <Badge
            variant="outline"
            className={cn(
              "notch-sm border-transparent font-mono text-[10px] uppercase tracking-widest",
              isTop ? "bg-gold/15 text-gold" : "bg-violet/15 text-violet"
            )}
          >
            {isTop ? "Top" : "Favorites"}
          </Badge>
        </div>
      </div>

      {/* Basics */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Basics
        </h2>
        <CollectionBasicsForm
          mode="edit"
          action={updateCollection.bind(null, collection.id)}
          submitLabel="Save changes"
          defaultValues={{
            title: collection.title,
            slug: collection.slug,
            description: collection.description ?? "",
            published: collection.published,
          }}
        />
      </section>

      {/* Items */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Items{" "}
            <span className="text-muted-foreground/60">({items.length})</span>
          </h2>
          {!isTop ? (
            <ItemFormDialog
              action={addItem.bind(null, collection.id)}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" /> Add item
                </Button>
              }
            />
          ) : null}
        </div>

        {isTop ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
            Scored “Top” items (rated against the rubric) are edited with the
            dynamic item form — coming in the next step. Basics above are
            editable now.
          </p>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No items yet. Use <span className="text-foreground">Add item</span> to
            create the first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
              >
                {/* Reorder */}
                <div className="flex flex-col">
                  <form action={moveItemUp.bind(null, item.id, collection.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={idx === 0}
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                  </form>
                  <form action={moveItemDown.bind(null, item.id, collection.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={idx === items.length - 1}
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </form>
                </div>

                {/* Preview (plain <img>; remote images configured in Phase 7) */}
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="size-12 shrink-0 rounded-md border border-border object-cover"
                  />
                ) : (
                  <div className="size-12 shrink-0 rounded-md border border-border bg-secondary" />
                )}

                {/* Body */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-base font-semibold">
                      {item.title}
                    </h3>
                    {item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground transition-colors hover:text-emerald"
                        aria-label="Open link"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : null}
                  </div>
                  {item.subtitle ? (
                    <p className="truncate text-sm text-muted-foreground">
                      {item.subtitle}
                    </p>
                  ) : null}
                  {item.note ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground/80">
                      {item.note}
                    </p>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <ItemFormDialog
                    action={updateItem.bind(null, item.id, collection.id)}
                    item={item}
                    trigger={
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    }
                    title={`Delete “${item.title}”?`}
                    description="This removes the item from the collection."
                    confirmLabel="Delete item"
                    successMessage="Item deleted."
                    action={deleteItem.bind(null, item.id, collection.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
