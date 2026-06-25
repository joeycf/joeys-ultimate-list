"use client";

import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/lib/slugify";
import type { Rubric } from "@/lib/types";

type Result = { ok?: boolean; error?: string };

type RubricValues = {
  ratings: { key: string; label: string; max: number; weight: number }[];
  fields: {
    key: string;
    label: string;
    type: "text" | "number" | "select";
    options: string[];
  }[];
  scoreMode: "sum" | "average" | "weighted";
};

function uniqueKey(base: string, taken: string[]): string {
  const root = base || "key";
  if (!taken.includes(root)) return root;
  let n = 2;
  while (taken.includes(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

function KeyTag({ value }: { value: string }) {
  return value ? (
    <p className="mt-2 font-mono text-[9px] tracking-wider text-muted-foreground/60">
      key: {value} <span className="text-muted-foreground/40">(locked)</span>
    </p>
  ) : (
    <p className="mt-2 font-mono text-[9px] tracking-wider text-gold/70">
      key generated when you leave the label field
    </p>
  );
}

export function RubricBuilder({
  rubric,
  hasItems,
  saveAction,
  recomputeAction,
}: {
  rubric: Rubric;
  hasItems: boolean;
  saveAction: (input: RubricValues) => Promise<Result>;
  recomputeAction: () => Promise<Result>;
}) {
  const router = useRouter();
  const form = useForm<RubricValues>({
    defaultValues: {
      ratings: rubric.ratings.map((c) => ({
        key: c.key,
        label: c.label,
        max: c.max,
        weight: c.weight ?? 1,
      })),
      fields: (rubric.fields ?? []).map((f) => ({
        key: f.key,
        label: f.label,
        type: f.type,
        options: f.options ?? [],
      })),
      scoreMode: rubric.scoreMode,
    },
  });

  const ratings = useFieldArray({ control: form.control, name: "ratings" });
  const fields = useFieldArray({ control: form.control, name: "fields" });

  function genKey(group: "ratings" | "fields", i: number) {
    const cur = form.getValues(`${group}.${i}.key`);
    if (cur) return; // immutable once set
    const slug = slugify(form.getValues(`${group}.${i}.label`));
    if (!slug) return;
    const taken = form
      .getValues(group)
      .map((row, idx) => (idx === i ? "" : row.key));
    form.setValue(`${group}.${i}.key`, uniqueKey(slug, taken));
  }

  async function onSubmit(values: RubricValues) {
    const cleaned: RubricValues = {
      scoreMode: values.scoreMode,
      ratings: values.ratings.map((r) => ({ ...r, label: r.label.trim() })),
      fields: values.fields.map((f) => ({
        ...f,
        label: f.label.trim(),
        options:
          f.type === "select"
            ? f.options.map((o) => o.trim()).filter(Boolean)
            : [],
      })),
    };

    const missing =
      cleaned.ratings.some((r) => !r.label || !r.key) ||
      cleaned.fields.some((f) => !f.label || !f.key);
    if (missing) {
      toast.error("Every criterion and field needs a label.");
      return;
    }

    const res = await saveAction(cleaned);
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Rubric saved — all scores recomputed.");
    router.refresh();
  }

  async function onRecompute() {
    const res = await recomputeAction();
    if (res?.error) {
      toast.error(res.error);
      return;
    }
    toast.success("All scores recomputed.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Rating criteria */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Rating criteria
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              ratings.append({ key: "", label: "", max: 10, weight: 1 })
            }
          >
            <Plus className="size-3.5" /> Add criterion
          </Button>
        </div>

        {ratings.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No criteria yet. Add at least one to score items.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ratings.fields.map((row, i) => (
              <li key={row.id} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Label
                    </span>
                    <Input
                      placeholder="Animation"
                      {...form.register(`ratings.${i}.label`)}
                      onBlur={() => genKey("ratings", i)}
                    />
                  </div>
                  <div className="flex w-16 flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Max
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...form.register(`ratings.${i}.max`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex w-16 flex-col gap-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      Weight
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="0.5"
                      {...form.register(`ratings.${i}.weight`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="flex flex-col">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={i === 0}
                      onClick={() => ratings.move(i, i - 1)}
                      aria-label="Move up"
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      disabled={i === ratings.fields.length - 1}
                      onClick={() => ratings.move(i, i + 1)}
                      aria-label="Move down"
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => ratings.remove(i)}
                    aria-label="Remove criterion"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <KeyTag value={form.watch(`ratings.${i}.key`)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Custom fields */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Custom fields
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              fields.append({ key: "", label: "", type: "text", options: [] })
            }
          >
            <Plus className="size-3.5" /> Add field
          </Button>
        </div>

        {fields.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Optional metadata like “Genre” or “Restaurant”.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {fields.fields.map((row, i) => (
              <FieldRow
                key={row.id}
                form={form}
                index={i}
                onBlurLabel={() => genKey("fields", i)}
                onRemove={() => fields.remove(i)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Score mode */}
      <div className="flex flex-col gap-1.5">
        <Label className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Score mode
        </Label>
        <Select
          value={form.watch("scoreMode")}
          onValueChange={(v) =>
            form.setValue("scoreMode", v as RubricValues["scoreMode"])
          }
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="average">Average</SelectItem>
            <SelectItem value="sum">Sum</SelectItem>
            <SelectItem value="weighted">Weighted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasItems ? (
        <p className="rounded-md border border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
          New criteria default to <span className="text-foreground">0</span> for
          existing items until you edit them. Saving recomputes every item&apos;s
          score under the new rubric.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save rubric"}
        </Button>
        <Button type="button" variant="outline" onClick={onRecompute}>
          Recompute all scores
        </Button>
      </div>
    </form>
  );
}

function FieldRow({
  form,
  index,
  onBlurLabel,
  onRemove,
}: {
  form: UseFormReturn<RubricValues>;
  index: number;
  onBlurLabel: () => void;
  onRemove: () => void;
}) {
  const type = form.watch(`fields.${index}.type`);
  const options = form.watch(`fields.${index}.options`) ?? [];
  const setOptions = (next: string[]) =>
    form.setValue(`fields.${index}.options`, next);

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Label
          </span>
          <Input
            placeholder="Genre"
            {...form.register(`fields.${index}.label`)}
            onBlur={onBlurLabel}
          />
        </div>
        <div className="flex w-32 flex-col gap-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Type
          </span>
          <Select
            value={type}
            onValueChange={(v) =>
              form.setValue(
                `fields.${index}.type`,
                v as RubricValues["fields"][number]["type"]
              )
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="select">Select</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={onRemove}
          aria-label="Remove field"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {type === "select" ? (
        <div className="mt-3 flex flex-col gap-2 border-l-2 border-violet/30 pl-3">
          <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
            Options
          </span>
          {options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2">
              <Input
                value={opt}
                placeholder={`Option ${oi + 1}`}
                onChange={(e) =>
                  setOptions(options.map((o, k) => (k === oi ? e.target.value : o)))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setOptions(options.filter((_, k) => k !== oi))}
                aria-label="Remove option"
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setOptions([...options, ""])}
          >
            <Plus className="size-3.5" /> Add option
          </Button>
        </div>
      ) : null}

      <KeyTag value={form.watch(`fields.${index}.key`)} />
    </li>
  );
}
