"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Criterion, RubricField, TopItemData } from "@/lib/types";

export function GroupedMetrics({
  criteria,
  fields,
  items,
}: {
  criteria: Criterion[];
  fields: RubricField[];
  items: TopItemData[];
}) {
  // Select fields with ≥2 distinct values present across the items.
  const groupable = useMemo(
    () =>
      fields.filter((f) => {
        if (f.type !== "select") return false;
        const distinct = new Set(
          items
            .map((i) => i.fieldValues?.[f.key])
            .filter((v) => v != null && v !== "")
            .map(String)
        );
        return distinct.size >= 2;
      }),
    [fields, items]
  );

  const [groupKey, setGroupKey] = useState<string>(groupable[0]?.key ?? "");
  const groupField =
    groupable.find((f) => f.key === groupKey) ?? groupable[0] ?? null;

  const groupData = useMemo(() => {
    if (!groupField) return [];
    const map = new Map<string, { sum: number; n: number }>();
    for (const it of items) {
      const v = it.fieldValues?.[groupField.key];
      if (v == null || v === "") continue;
      const key = String(v);
      const e = map.get(key) ?? { sum: 0, n: 0 };
      e.sum += it.score;
      e.n += 1;
      map.set(key, e);
    }
    return [...map.entries()]
      .map(([group, { sum, n }]) => ({
        group,
        avg: Math.round((sum / n) * 10) / 10,
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [groupField, items]);

  if (criteria.length === 0 || items.length === 0) return null;

  const bestPer = criteria.map((c) => {
    let best: TopItemData | null = null;
    let bestVal = -Infinity;
    for (const it of items) {
      const v = Number(it.ratings?.[c.key] ?? 0);
      if (v > bestVal) {
        bestVal = v;
        best = it;
      }
    }
    return { criterion: c, best, value: best ? bestVal : 0 };
  });

  const config: ChartConfig = { avg: { label: "Avg score", color: "var(--chart-3)" } };

  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Best per criterion
        </h3>
        <ul className="flex flex-col gap-2">
          {bestPer.map(({ criterion, best, value }) => (
            <li
              key={criterion.key}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="w-28 shrink-0 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {criterion.label}
              </span>
              <span className="min-w-0 flex-1 truncate text-right">
                {best?.title ?? "—"}
              </span>
              <span className="shrink-0 font-mono tabular-nums text-emerald">
                {value}
                <span className="text-muted-foreground/50">/{criterion.max}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      {groupField ? (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Avg score by {groupField.label}
            </h3>
            {groupable.length > 1 ? (
              <Select value={groupKey} onValueChange={setGroupKey}>
                <SelectTrigger className="h-7 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupable.map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          <ChartContainer config={config} className="min-h-[200px] w-full">
            <BarChart data={groupData} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" domain={[0, "dataMax"]} hide />
              <YAxis
                type="category"
                dataKey="group"
                width={110}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avg" fill="var(--chart-3)" radius={3} />
            </BarChart>
          </ChartContainer>
        </div>
      ) : null}
    </div>
  );
}
