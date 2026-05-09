ALTER TABLE "extensions" ALTER COLUMN "func_cat" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "extensions" ALTER COLUMN "sub_cat" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "extension_versions" ADD COLUMN "source_method" text DEFAULT 'zip' NOT NULL;--> statement-breakpoint
ALTER TABLE "extension_versions" ADD COLUMN "source_meta" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "extensions" ADD COLUMN "permissions" jsonb DEFAULT '{}'::jsonb NOT NULL;
-- NOTE: search_vector is hand-applied via `bun run db:apply-fts` (drizzle/0002_fts_search_vector.sql).
-- Drizzle's introspection re-suggests adding the column here because it's not
-- tracked in the journal, but doing so would clobber the GENERATED ALWAYS expression.
