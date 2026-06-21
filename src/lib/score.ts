type Criterion = { key: string; label: string; max: number; weight?: number };
type Rubric = {
  ratings: Criterion[];
  scoreMode: "sum" | "average" | "weighted";
};

export function computeScore(rubric: Rubric, ratings: Record<string, number>) {
  const cs = rubric.ratings;
  const get = (k: string) => Number(ratings[k] ?? 0);

  if (rubric.scoreMode === "sum") {
    return cs.reduce((a, c) => a + get(c.key), 0); // e.g. 8+9+7+10 = 34
  }
  if (rubric.scoreMode === "weighted") {
    const wsum = cs.reduce((a, c) => a + (c.weight ?? 1), 0);
    const num = cs.reduce((a, c) => a + get(c.key) * (c.weight ?? 1), 0);
    return wsum ? num / wsum : 0; // weighted avg on scale
  }
  // average (default): reads nicely as "9.75 / 10"
  return cs.length ? cs.reduce((a, c) => a + get(c.key), 0) / cs.length : 0;
}
