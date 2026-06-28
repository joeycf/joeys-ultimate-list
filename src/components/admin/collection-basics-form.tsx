"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageInput } from "@/components/admin/image-input";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/slugify";
import {
  collectionBasicsSchema,
  type CollectionBasicsInput,
} from "@/lib/validation";

type Result = {
  ok?: boolean;
  id?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function ToggleSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-emerald" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-background shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function CollectionBasicsForm({
  mode,
  action,
  uploadAction,
  defaultValues,
  submitLabel,
}: {
  mode: "create" | "edit";
  action: (input: CollectionBasicsInput) => Promise<Result>;
  uploadAction: (formData: FormData) => Promise<{ url?: string; error?: string }>;
  defaultValues: CollectionBasicsInput;
  submitLabel: string;
}) {
  const router = useRouter();
  // In edit mode the slug is already set, so don't auto-overwrite from the title.
  const [slugEdited, setSlugEdited] = useState(mode === "edit");

  const form = useForm<CollectionBasicsInput>({
    resolver: zodResolver(collectionBasicsSchema),
    defaultValues,
  });

  async function onSubmit(values: CollectionBasicsInput) {
    const res = await action(values);
    if (res?.fieldErrors) {
      for (const [name, message] of Object.entries(res.fieldErrors)) {
        form.setError(name as keyof CollectionBasicsInput, { message });
      }
      return;
    }
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    if (mode === "create" && res?.id) {
      toast.success("Collection created — now add some items.");
      router.push(`/admin/${res.id}/edit`);
      return;
    }
    toast.success("Saved.");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Favorite Fruits"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!slugEdited) {
                      form.setValue("slug", slugify(e.target.value), {
                        shouldValidate: form.formState.isSubmitted,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input
                  placeholder="favorite-fruits"
                  {...field}
                  onChange={(e) => {
                    setSlugEdited(true);
                    field.onChange(e);
                  }}
                />
              </FormControl>
              <FormDescription>
                Public URL: <span className="font-mono">/c/{field.value || "…"}</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="A short blurb about this collection…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="coverImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Cover image{" "}
                <span className="text-muted-foreground">(optional)</span>
              </FormLabel>
              <ImageInput
                value={field.value ?? ""}
                onChange={field.onChange}
                uploadAction={uploadAction}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <FormLabel>Published</FormLabel>
                  <FormDescription>
                    {field.value
                      ? "Visible on the public site."
                      : "Hidden — draft only."}
                  </FormDescription>
                </div>
                <ToggleSwitch
                  checked={!!field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            </FormItem>
          )}
        />

        <div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
