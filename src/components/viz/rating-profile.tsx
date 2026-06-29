"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { Criterion, TopItemData } from "@/lib/types";

const SLOT_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];
const MAX_SELECT = 3;

interface RatingProfileProps {
  criteria: Criterion[];
  items: TopItemData[];
}

export function RatingProfile({ criteria, items }: RatingProfileProps) {
  const [selected, setSelected] = useState<string[]>(
    items.length ? [items[0].id] : []
  );

  if (criteria.length === 0 || items.length === 0) return null;

  const selItems = selected
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is TopItemData => Boolean(i));

  const handleToggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_SELECT
          ? prev
          : [...prev, id]
    );

  // Normalize each rating to a 0–100 percentage of its criterion's max so
  // criteria with different maxes are comparable.
  const data = criteria.map((c) => {
    const row: Record<string, string | number> = { criterion: c.label };
    selItems.forEach((it, slot) => {
      const raw = Number(it.ratings?.[c.key] ?? 0);
      row[`item${slot}`] = c.max > 0 ? Math.round((raw / c.max) * 100) : 0;
    });
    return row;
  });

  const config: ChartConfig = {};
  selItems.forEach((it, slot) => {
    config[`item${slot}`] = { label: it.title, color: SLOT_COLORS[slot] };
  });

  const isRadar = criteria.length >= 3;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Profile
        </h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
          normalized · pick up to {MAX_SELECT}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => {
          const active = selected.includes(it.id);
          const slot = selected.indexOf(it.id);
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => handleToggle(it.id)}
              disabled={!active && selected.length >= MAX_SELECT}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                active
                  ? "border-transparent text-background"
                  : "border-border text-muted-foreground hover:border-emerald/40 hover:text-foreground"
              )}
              style={active ? { backgroundColor: SLOT_COLORS[slot] } : undefined}
            >
              {it.title}
            </button>
          );
        })}
      </div>

      {selItems.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Select an item to see its profile.
        </p>
      ) : isRadar ? (
        <ChartContainer config={config} className="mx-auto min-h-[300px] w-full max-w-md">
          <RadarChart data={data} outerRadius="70%">
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarGrid />
            <PolarAngleAxis dataKey="criterion" />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            {selItems.map((_, slot) => (
              <Radar
                key={slot}
                dataKey={`item${slot}`}
                stroke={SLOT_COLORS[slot]}
                fill={SLOT_COLORS[slot]}
                fillOpacity={0.15}
              />
            ))}
          </RadarChart>
        </ChartContainer>
      ) : (
        <ChartContainer config={config} className="min-h-[220px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="criterion"
              width={96}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {selItems.map((_, slot) => (
              <Bar key={slot} dataKey={`item${slot}`} fill={SLOT_COLORS[slot]} radius={3} />
            ))}
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
