"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { favoriteItemSchema, type FavoriteItemInput } from "@/lib/validation";

type Result = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ItemValues = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  link: string | null;
  note: string | null;
};

export function ItemFormDialog({
  action,
  item,
  trigger,
}: {
  action: (input: FavoriteItemInput) => Promise<Result>;
  item?: ItemValues;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!item;

  const emptyValues: FavoriteItemInput = {
    title: "",
    subtitle: "",
    imageUrl: "",
    link: "",
    note: "",
  };

  const form = useForm<FavoriteItemInput>({
    resolver: zodResolver(favoriteItemSchema),
    defaultValues: item
      ? {
          title: item.title,
          subtitle: item.subtitle ?? "",
          imageUrl: item.imageUrl ?? "",
          link: item.link ?? "",
          note: item.note ?? "",
        }
      : emptyValues,
  });

  async function onSubmit(values: FavoriteItemInput) {
    const res = await action(values);
    if (res?.fieldErrors) {
      for (const [name, message] of Object.entries(res.fieldErrors)) {
        form.setError(name as keyof FavoriteItemInput, { message });
      }
      return;
    }
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Item updated." : "Item added.");
    setOpen(false);
    if (!isEdit) form.reset(emptyValues);
    router.refresh();
  }

  const imageUrl = form.watch("imageUrl");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          form.reset(
            item
              ? {
                  title: item.title,
                  subtitle: item.subtitle ?? "",
                  imageUrl: item.imageUrl ?? "",
                  link: item.link ?? "",
                  note: item.note ?? "",
                }
              : emptyValues
          );
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            Favorites entry — title is required, everything else is optional.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Mango" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subtitle{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="The king of fruits" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Image URL{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {imageUrl ? (
              // Plain <img> on purpose (no next/image remote-host config this pass).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt=""
                className="h-28 w-full rounded-md border border-border object-cover"
              />
            ) : null}

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Link{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Note{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Why I love it…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : isEdit
                    ? "Save item"
                    : "Add item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
