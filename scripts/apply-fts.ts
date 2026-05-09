// Applies drizzle/0002_fts_search_vector.sql.
//
// This migration is hand-written (it adds a Postgres GENERATED column and
// pg_trgm indexes that drizzle-kit can't infer from the schema) and is not
// listed in `drizzle/meta/_journal.json`, so `drizzle-kit migrate` skips it.
// Run this once per database. The SQL uses IF NOT EXISTS guards, so it's
// safe to re-run.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { sql } from "drizzle-orm";

import { db } from "@/lib/db/client";

async function main() {
  const file = resolve(process.cwd(), "drizzle/0002_fts_search_vector.sql");
  const text = readFileSync(file, "utf8");

  console.log(`apply-fts: executing ${file}`);
  await db.execute(sql.raw(text));
  console.log("apply-fts: done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("apply-fts: failed");
    console.error(err);
    process.exit(1);
  });
