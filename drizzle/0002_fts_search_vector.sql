-- Phase 12: Full-text search via tsvector + pg_trgm
-- Run once against the Neon database; safe to re-run (IF NOT EXISTS guards).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE "extensions"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(name, '')),           'A') ||
    setweight(to_tsvector('simple', coalesce(name_zh, '')),        'A') ||
    setweight(to_tsvector('simple', coalesce(tagline, '')),        'B') ||
    setweight(to_tsvector('simple', coalesce(description, '')),    'C') ||
    setweight(to_tsvector('simple', coalesce(description_zh, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS "idx_ext_search"
  ON "extensions" USING GIN ("search_vector");

CREATE INDEX IF NOT EXISTS "idx_ext_name_trgm"
  ON "extensions" USING GIN (lower("name") gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "idx_ext_name_zh_trgm"
  ON "extensions" USING GIN ("name_zh" gin_trgm_ops)
  WHERE "name_zh" IS NOT NULL;
