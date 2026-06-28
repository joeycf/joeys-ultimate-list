import Link from "next/link";
import type { Metadata } from "next";
import { CollectionBasicsForm } from "@/components/admin/collection-basics-form";
import { createCollection, uploadImage } from "../../actions";

export const metadata: Metadata = {
  title: "New Favorites — Admin",
};

export default function NewFavoritesPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <div className="mt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-violet">
          New · Favorites
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Create a favorites collection
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with the basics — you&apos;ll add items on the next screen.
        </p>
      </div>

      <div className="mt-8">
        <CollectionBasicsForm
          mode="create"
          action={createCollection.bind(null, "favorites")}
          uploadAction={uploadImage}
          submitLabel="Create & add items"
          defaultValues={{
            title: "",
            slug: "",
            description: "",
            coverImage: "",
            published: false,
          }}
        />
      </div>
    </div>
  );
}
