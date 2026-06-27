import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url), { schema });
}

type DbClient = ReturnType<typeof createClient>;

// Create the Neon client lazily on first query, so importing this module (e.g.
// during `next build`) never reads DATABASE_URL at module load. The variable is
// only needed at request time inside Server Components / Server Actions.
let client: DbClient | undefined;

export const db = new Proxy({} as DbClient, {
  get(_target, prop) {
    client ??= createClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
