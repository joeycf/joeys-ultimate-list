import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface AdminCardControlsProps {
  id: string;
  title: string;
  isDraft: boolean;
  deleteAction: () => Promise<{ ok?: boolean; error?: string }>;
}

/**
 * Admin-only overlay for a collection card on the public home. A "Draft" badge
 * (always visible) plus an Edit link + Delete confirm, revealed on hover, in a
 * top-right cluster (clear of the type badge). Rendered as a sibling of the
 * card's link — never nested inside it. Conditional render is UX only; the
 * boundary is deleteCollection/requireAdmin + the confirm dialog.
 */
export function AdminCardControls({
  id,
  title,
  isDraft,
  deleteAction,
}: AdminCardControlsProps) {
  return (
    <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
      {isDraft ? (
        <Badge
          variant="outline"
          className="notch-sm border-transparent bg-gold/15 font-mono text-[10px] uppercase tracking-widest text-gold"
        >
          Draft
        </Badge>
      ) : null}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/admin:opacity-100 focus-within:opacity-100">
        <Link
          href={`/admin/${id}/edit`}
          aria-label={`Edit ${title}`}
          className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:border-emerald/50 hover:text-emerald"
        >
          <Pencil className="size-3.5" />
        </Link>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              aria-label={`Delete ${title}`}
              className="inline-flex size-7 items-center justify-center rounded-md border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:border-destructive/50 hover:text-destructive"
            >
              <Trash2 className="size-3.5" />
            </button>
          }
          title={`Delete "${title}"?`}
          description="This permanently deletes the collection and all of its items. This can't be undone."
          confirmLabel="Delete collection"
          successMessage="Collection deleted."
          action={deleteAction}
        />
      </div>
    </div>
  );
}
