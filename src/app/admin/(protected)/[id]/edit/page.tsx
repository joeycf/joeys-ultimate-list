import type { ReactNode } from "react";
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
import { RubricBuilder } from "@/components/admin/rubric-builder";
import { TopItemFormDialog } from "@/components/admin/top-item-form-dialog";
import type { Rubric } from "@/lib/types";
import {
  addItem,
  addTopItem,
  deleteItem,
  moveItemDown,
  moveItemUp,
  recomputeCollectionScores,
  updateCollection,
  updateItem,
  updateRubric,
  updateTopItem,
  uploadImage,
} from "../../actions";

interface SectionLabelProps {
  children: ReactNode;
}

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
      {children}
    </h2>
  );
}

const fmtScore = (n: number | null) =>
  n == null ? "—" : (Math.round(n * 10) / 10).toFixed(1);

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
  const rubric: Rubric =
    (collection.config as Rubric | null) ?? {
      ratings: [],
      fields: [],
      scoreMode: "average",
    };

  // Top items are shown in rank order (by score desc, position as tiebreak).
  const rankedTop = [...items].sort((a, b) => {
    const sa = a.score ?? 0;
    const sb = b.score ?? 0;
    if (sb !== sa) return sb - sa;
    return a.position - b.position;
  });

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
        <SectionLabel>Basics</SectionLabel>
        <CollectionBasicsForm
          mode="edit"
          action={updateCollection.bind(null, collection.id)}
          uploadAction={uploadImage}
          submitLabel="Save changes"
          defaultValues={{
            title: collection.title,
            slug: collection.slug,
            description: collection.description ?? "",
            coverImage: collection.coverImage ?? "",
            published: collection.published,
          }}
        />
      </section>

      {isTop ? (
        <>
          {/* Rubric builder */}
          <section className="flex flex-col gap-4">
            <SectionLabel>Rubric</SectionLabel>
            <RubricBuilder
              rubric={rubric}
              hasItems={items.length > 0}
              saveAction={updateRubric.bind(null, collection.id)}
              recomputeAction={recomputeCollectionScores.bind(null, collection.id)}
            />
          </section>

          {/* Top items */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <SectionLabel>
                Items{" "}
                <span className="text-muted-foreground/60">({items.length})</span>
              </SectionLabel>
              {rubric.ratings.length > 0 ? (
                <TopItemFormDialog
                  rubric={rubric}
                  action={addTopItem.bind(null, collection.id)}
                  uploadAction={uploadImage}
                  trigger={
                    <Button size="sm">
                      <Plus className="size-4" /> Add item
                    </Button>
                  }
                />
              ) : null}
            </div>

            {rubric.ratings.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
                Add at least one rating criterion above first.
              </p>
            ) : items.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No items yet. Use <span className="text-foreground">Add item</span>{" "}
                to rate your first entry.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {rankedTop.map((item, idx) => {
                  const ratings = (item.ratings as Record<string, number> | null) ?? {};
                  const fieldValues =
                    (item.fieldValues as Record<string, string | number | null> | null) ?? {};
                  return (
                    <li
                      key={item.id}
                      className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="w-9 shrink-0 text-center font-mono text-lg font-bold tabular-nums text-gold">
                        <span className="align-top text-[0.6em] opacity-60">#</span>
                        {String(idx + 1).padStart(2, "0")}
                      </div>
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
                        <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {rubric.ratings
                            .map((c) => `${c.label} ${ratings[c.key] ?? 0}`)
                            .join(" · ")}
                          {(rubric.fields ?? [])
                            .filter((f) => fieldValues[f.key] != null && fieldValues[f.key] !== "")
                            .map((f) => ` · ${f.label}: ${fieldValues[f.key]}`)
                            .join("")}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-xl font-bold tabular-nums text-gold">
                          {fmtScore(item.score)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <form action={moveItemUp.bind(null, item.id, collection.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            aria-label="Move up (tiebreak)"
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
                            aria-label="Move down (tiebreak)"
                          >
                            <ChevronDown className="size-4" />
                          </Button>
                        </form>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <TopItemFormDialog
                          rubric={rubric}
                          action={updateTopItem.bind(null, item.id, collection.id)}
                          uploadAction={uploadImage}
                          item={{
                            id: item.id,
                            title: item.title,
                            subtitle: item.subtitle,
                            imageUrl: item.imageUrl,
                            link: item.link,
                            ratings,
                            fieldValues,
                          }}
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
                          title={`Delete "${item.title}"?`}
                          description="This removes the item from the collection."
                          confirmLabel="Delete item"
                          successMessage="Item deleted."
                          action={deleteItem.bind(null, item.id, collection.id)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </>
      ) : (
        /* Favorites items */
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionLabel>
              Items{" "}
              <span className="text-muted-foreground/60">({items.length})</span>
            </SectionLabel>
            <ItemFormDialog
              action={addItem.bind(null, collection.id)}
              uploadAction={uploadImage}
              trigger={
                <Button size="sm">
                  <Plus className="size-4" /> Add item
                </Button>
              }
            />
          </div>

          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No items yet. Use <span className="text-foreground">Add item</span>{" "}
              to create the first one.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {items.map((item, idx) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-3"
                >
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

                  <div className="flex shrink-0 items-center gap-2">
                    <ItemFormDialog
                      action={updateItem.bind(null, item.id, collection.id)}
                      uploadAction={uploadImage}
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
                      title={`Delete "${item.title}"?`}
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
      )}
    </div>
  );
}
