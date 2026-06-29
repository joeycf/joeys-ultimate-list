import Link from "next/link";
import { getAllCollections } from "@/db/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewCollectionMenu } from "@/components/admin/new-collection-menu";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { deleteCollection } from "./actions";

export default async function AdminDashboard() {
  const collections = await getAllCollections();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald">
            Dashboard
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
            Collections
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {collections.length} total · drafts included
          </p>
        </div>
        <NewCollectionMenu />
      </div>

      {collections.length === 0 ? (
        <EmptyState
          title="You haven't made any lists yet."
          description="Start with a flat Favorites list, or a scored Top list with a rubric."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild>
                <Link href="/admin/new/favorites">New Favorites</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/new/top">New Top</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {collections.map((c) => {
            const isTop = c.type === "top";
            return (
              <li
                key={c.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-base font-semibold">
                      {c.title}
                    </h2>
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
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                    <span>
                      {c.items.length} {c.items.length === 1 ? "item" : "items"}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className={c.published ? "text-emerald" : "text-gold"}>
                      {c.published ? "Published" : "Draft"}
                    </span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="normal-case">/c/{c.slug}</span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/${c.id}/edit`}>Edit</Link>
                  </Button>
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
                    title={`Delete "${c.title}"?`}
                    description="This permanently deletes the collection and all of its items. This can't be undone."
                    confirmLabel="Delete collection"
                    successMessage="Collection deleted."
                    action={deleteCollection.bind(null, c.id)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
