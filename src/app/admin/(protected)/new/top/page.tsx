import Link from "next/link";
import type { Metadata } from "next";
import { CollectionBasicsForm } from "@/components/admin/collection-basics-form";
import { createCollection, uploadImage } from "../../actions";

export const metadata: Metadata = {
  title: "New Top — Admin",
};

export default function NewTopPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin"
        className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Dashboard
      </Link>

      <div className="mt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-gold">
          New · Top
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          Create a scored collection
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start with the basics — you&apos;ll define the rubric and add rated
          items on the next screen.
        </p>
      </div>

      <div className="mt-8">
        <CollectionBasicsForm
          mode="create"
          action={createCollection.bind(null, "top")}
          uploadAction={uploadImage}
          submitLabel="Create & define rubric"
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
