// Shared, framework-agnostic types for the rubric model stored in
// collections.config and on item rows. No DB/server imports here so these
// are safe to use from any component.

/** A single rating criterion in a "top" collection's rubric. */
export type Criterion = {
  key: string;
  label: string;
  max: number;
  weight?: number;
};

/** A custom field in a "top" collection's rubric. */
export type RubricField = {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  options?: string[];
};

/** The rubric stored in collections.config (top collections only). */
export type Rubric = {
  ratings: Criterion[];
  fields?: RubricField[];
  scoreMode: "sum" | "average" | "weighted";
};

/** An item's per-criterion ratings, keyed to rubric.ratings[].key. */
export type ItemRatings = Record<string, number>;

/** An item's custom field values, keyed to rubric.fields[].key. */
export type ItemFieldValues = Record<string, string | number | null>;

/** Serializable shape passed to the public Top data-viz client components. */
export type TopItemData = {
  id: string;
  rank: number; // 1-based rank by score desc
  title: string;
  score: number;
  imageUrl: string | null;
  ratings: Record<string, number>;
  fieldValues: Record<string, string | number | null>;
};
