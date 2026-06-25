"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { buildTopItemSchema } from "@/lib/validation";
import { computeScore } from "@/lib/score";
import type { Rubric } from "@/lib/types";

type Result = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

export type TopItem = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  link: string | null;
  ratings: Record<string, number> | null;
  fieldValues: Record<string, string | number | null> | null;
};

type FormValues = {
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  ratings: Record<string, number>;
  fieldValues: Record<string, string>;
};

const NONE = "__none__";

export function TopItemFormDialog({
  rubric,
  action,
  item,
  trigger,
}: {
  rubric: Rubric;
  action: (input: FormValues) => Promise<Result>;
  item?: TopItem;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isEdit = !!item;
  const schema = useMemo(() => buildTopItemSchema(rubric), [rubric]);

  const makeDefaults = (): FormValues => ({
    title: item?.title ?? "",
    subtitle: item?.subtitle ?? "",
    imageUrl: item?.imageUrl ?? "",
    link: item?.link ?? "",
    ratings: Object.fromEntries(
      rubric.ratings.map((c) => [c.key, Number(item?.ratings?.[c.key] ?? 0)])
    ),
    fieldValues: Object.fromEntries(
      (rubric.fields ?? []).map((f) => {
        const v = item?.fieldValues?.[f.key];
        return [f.key, v == null ? "" : String(v)];
      })
    ),
  });

  const form = useForm<FormValues>({
    // The schema is built from the runtime rubric, so its static output type
    // is looser than FormValues — cast the resolver (runtime validation is
    // unchanged; the server re-validates and is the source of truth).
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: makeDefaults(),
  });

  const watchedRatings = form.watch("ratings");
  const previewScore = computeScore(rubric, watchedRatings ?? {});

  async function onSubmit(values: FormValues) {
    const res = await action(values);
    if (res?.fieldErrors) {
      for (const [name, message] of Object.entries(res.fieldErrors)) {
        form.setError(name as keyof FormValues, { message });
      }
      return;
    }
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Item updated." : "Item added.");
    setOpen(false);
    if (!isEdit) form.reset(makeDefaults());
    router.refresh();
  }

  const imageUrl = form.watch("imageUrl");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(makeDefaults());
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            Rate this entry against the rubric — the score is computed on save.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Frieren" {...field} />
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
                    Subtitle <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                    Image URL <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {imageUrl ? (
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
                    Link <span className="text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ratings (sliders) */}
            <div className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Ratings
                </span>
                <span className="font-mono text-sm text-gold">
                  {(Math.round(previewScore * 10) / 10).toFixed(1)}
                  <span className="text-muted-foreground/50"> score</span>
                </span>
              </div>
              {rubric.ratings.map((c) => (
                <Controller
                  key={c.key}
                  control={form.control}
                  name={`ratings.${c.key}`}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{c.label}</span>
                        <span className="font-mono text-sm tabular-nums text-emerald">
                          {Number(field.value) || 0}
                          <span className="text-muted-foreground/50"> / {c.max}</span>
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={c.max}
                        step={1}
                        value={[Number(field.value) || 0]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </div>
                  )}
                />
              ))}
            </div>

            {/* Custom fields */}
            {(rubric.fields ?? []).length > 0 ? (
              <div className="flex flex-col gap-4">
                {(rubric.fields ?? []).map((f) => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <FormLabel>
                      {f.label}{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    {f.type === "select" ? (
                      <Controller
                        control={form.control}
                        name={`fieldValues.${f.key}`}
                        render={({ field }) => (
                          <Select
                            value={field.value || undefined}
                            onValueChange={(v) =>
                              field.onChange(v === NONE ? "" : v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choose…" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>— None —</SelectItem>
                              {(f.options ?? []).map((o) => (
                                <SelectItem key={o} value={o}>
                                  {o}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    ) : (
                      <Input
                        type={f.type === "number" ? "number" : "text"}
                        inputMode={f.type === "number" ? "decimal" : undefined}
                        {...form.register(`fieldValues.${f.key}`)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : null}

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
