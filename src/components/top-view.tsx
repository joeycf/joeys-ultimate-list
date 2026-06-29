import { CoverImage } from "@/components/cover-image";
import { RatingProfile } from "@/components/viz/rating-profile";
import { GroupedMetrics } from "@/components/viz/grouped-metrics";
import { TopDataTable } from "@/components/viz/top-data-table";
import { cn } from "@/lib/utils";
import type { CollectionWithItems } from "@/db/queries";
import type { Criterion, ItemRatings, Rubric, TopItemData } from "@/lib/types";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

const formatScore = (n: number | null | undefined): string => {
  if (n == null) return "—";
  return (Math.round(n * 10) / 10).toFixed(1);
};

interface TopViewProps {
  collection: CollectionWithItems;
}

/** Top = a scored leaderboard (sorted by score desc) + summary stat cards. */
export function TopView({ collection }: TopViewProps) {
  const rubric = (collection.config as Rubric | null) ?? null;
  const criteria = rubric?.ratings ?? [];

  const ranked = [...collection.items].sort((a, b) => {
    const sa = a.score ?? 0;
    const sb = b.score ?? 0;
    if (sb !== sa) return sb - sa;
    return a.position - b.position;
  });

  const count = ranked.length;
  const scores = ranked.map((i) => i.score ?? 0);
  const avg = count ? scores.reduce((s, v) => s + v, 0) / count : 0;
  const leader = ranked[0];

  // Display scale: sum mode totals all criterion maxes; otherwise it's the
  // (shared) criterion max, e.g. "/ 10".
  const maxScale =
    rubric?.scoreMode === "sum"
      ? criteria.reduce((s, c) => s + c.max, 0)
      : Math.max(10, ...criteria.map((c) => c.max));

  // Serializable, rank-stamped data for the client viz components below.
  const fields = rubric?.fields ?? [];
  const itemData: TopItemData[] = ranked.map((item, idx) => ({
    id: item.id,
    rank: idx + 1,
    title: item.title,
    score: item.score ?? 0,
    imageUrl: item.imageUrl,
    ratings: (item.ratings as Record<string, number> | null) ?? {},
    fieldValues:
      (item.fieldValues as Record<string, string | number | null> | null) ?? {},
  }));

  return (
    <div className="flex flex-col gap-10">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Highest Rated"
          value={formatScore(leader?.score)}
          caption={leader?.title}
          accent
        />
        <StatCard label="Average Score" value={formatScore(avg)} caption={`out of ${maxScale}`} />
        <StatCard label="Entries" value={String(count)} caption="ranked" />
      </div>

      {/* Leaderboard */}
      <section>
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Leaderboard
        </h2>
        <ol className="mt-4 flex flex-col gap-3">
          {ranked.map((item, idx) => (
            <LeaderboardRow
              key={item.id}
              rank={idx + 1}
              title={item.title}
              score={item.score}
              imageUrl={item.imageUrl}
              ratings={(item.ratings as ItemRatings | null) ?? {}}
              criteria={criteria}
              maxScale={maxScale}
            />
          ))}
        </ol>
      </section>

      {/* Data visualization — all rubric-driven (Phase 6) */}
      {itemData.length > 0 ? (
        <div className="flex flex-col gap-6">
          {criteria.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RatingProfile criteria={criteria} items={itemData} />
              <GroupedMetrics
                criteria={criteria}
                fields={fields}
                items={itemData}
              />
            </div>
          ) : null}
          <TopDataTable criteria={criteria} fields={fields} items={itemData} />
        </div>
      ) : null}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  accent?: boolean;
}

function StatCard({ label, value, caption, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-mono text-3xl font-bold tabular-nums",
          accent && "text-gold text-glow"
        )}
      >
        {value}
      </div>
      {caption ? (
        <div className="mt-1 line-clamp-1 text-sm text-muted-foreground">{caption}</div>
      ) : null}
    </div>
  );
}

interface LeaderboardRowProps {
  rank: number;
  title: string;
  score: number | null;
  imageUrl: string | null;
  ratings: ItemRatings;
  criteria: Criterion[];
  maxScale: number;
}

function LeaderboardRow({
  rank,
  title,
  score,
  imageUrl,
  ratings,
  criteria,
  maxScale,
}: LeaderboardRowProps) {
  const isFirst = rank === 1;
  const padded = String(rank).padStart(2, "0");

  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors",
        isFirst
          ? "border-gold/50 bg-gold/5 shadow-[0_0_28px_-8px_var(--color-gold)]"
          : "border-border hover:border-emerald/40"
      )}
    >
      {/* Rank */}
      <div className="flex w-10 shrink-0 flex-col items-center">
        <span
          className={cn(
            "font-mono font-bold leading-none tabular-nums text-gold",
            isFirst ? "text-3xl text-glow" : "text-2xl opacity-80"
          )}
        >
          <span className="align-top text-[0.6em] opacity-60">#</span>
          {padded}
        </span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
          rank
        </span>
      </div>

      {/* Thumbnail */}
      <CoverImage
        url={imageUrl}
        alt={title}
        accent={isFirst ? "gold" : "emerald"}
        className="hidden size-12 shrink-0 rounded-md sm:block"
        sizes="48px"
      />

      {/* Title + per-criterion bars */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-display text-base font-semibold leading-tight">
          {title}
        </h3>
        {criteria.length > 0 ? (
          <CriterionBars criteria={criteria} ratings={ratings} className="mt-2.5" />
        ) : null}
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <div
          className={cn(
            "font-mono text-2xl font-bold tabular-nums text-gold",
            isFirst && "text-3xl text-glow"
          )}
        >
          {formatScore(score)}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          / {maxScale}
        </div>
      </div>
    </li>
  );
}

interface CriterionBarsProps {
  criteria: Criterion[];
  ratings: ItemRatings;
  className?: string;
}

function CriterionBars({ criteria, ratings, className }: CriterionBarsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4", className)}>
      {criteria.map((c) => {
        const v = Number(ratings?.[c.key] ?? 0);
        const pct = c.max > 0 ? clamp((v / c.max) * 100) : 0;
        return (
          <div key={c.key} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              <span className="truncate">{c.label}</span>
              <span className="tabular-nums text-foreground/70">{v}</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
