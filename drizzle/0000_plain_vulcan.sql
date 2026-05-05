CREATE TYPE "public"."membership_role" AS ENUM('viewer', 'publisher', 'admin');--> statement-breakpoint
CREATE TYPE "public"."extension_badge" AS ENUM('official', 'popular', 'new');--> statement-breakpoint
CREATE TYPE "public"."extension_category" AS ENUM('skills', 'mcp', 'slash', 'plugins');--> statement-breakpoint
CREATE TYPE "public"."extension_scope" AS ENUM('personal', 'org', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."file_scan_status" AS ENUM('pending', 'clean', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."func_cat" AS ENUM('workTask', 'business', 'tools');--> statement-breakpoint
CREATE TYPE "public"."version_status" AS ENUM('pending', 'scanning', 'ready', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."extension_visibility" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."system_kind" AS ENUM('installed', 'saved');--> statement-breakpoint
CREATE TYPE "public"."install_source" AS ENUM('cli', 'web');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"name" text,
	"image" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"theme_preference" text DEFAULT 'ivory' NOT NULL,
	"default_dept_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"name_zh" text NOT NULL,
	"path_depth" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text NOT NULL,
	"dept_id" text,
	"role" "membership_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_user_org_unique" UNIQUE("user_id","org_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_zh" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "extension_tags" (
	"extension_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "extension_tags_extension_id_tag_id_pk" PRIMARY KEY("extension_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "extension_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"extension_id" text NOT NULL,
	"version" text NOT NULL,
	"changelog" text,
	"changelog_zh" text,
	"manifest_json" jsonb,
	"bundle_file_id" text,
	"status" "version_status" DEFAULT 'pending' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ext_version_unique" UNIQUE("extension_id","version")
);
--> statement-breakpoint
CREATE TABLE "extensions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"category" "extension_category" NOT NULL,
	"badge" "extension_badge",
	"scope" "extension_scope" NOT NULL,
	"func_cat" "func_cat" NOT NULL,
	"sub_cat" text NOT NULL,
	"l2" text,
	"publisher_user_id" text,
	"owner_org_id" text NOT NULL,
	"dept_id" text,
	"icon_emoji" text,
	"icon_color" text,
	"visibility" "extension_visibility" DEFAULT 'draft' NOT NULL,
	"name" text NOT NULL,
	"name_zh" text,
	"tagline" text,
	"tagline_zh" text,
	"description" text,
	"description_zh" text,
	"homepage_url" text,
	"repo_url" text,
	"license_spdx" text,
	"compatibility_json" jsonb,
	"downloads_count" integer DEFAULT 0 NOT NULL,
	"stars_avg" numeric(2, 1) DEFAULT '0.0' NOT NULL,
	"ratings_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "extensions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" text PRIMARY KEY NOT NULL,
	"extension_version_id" text,
	"r2_key" text NOT NULL,
	"size" bigint NOT NULL,
	"checksum_sha256" text NOT NULL,
	"mime_type" text,
	"scan_status" "file_scan_status" DEFAULT 'pending' NOT NULL,
	"scan_report" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"label_en" text NOT NULL,
	"label_zh" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_items" (
	"collection_id" text NOT NULL,
	"extension_id" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_items_collection_id_extension_id_pk" PRIMARY KEY("collection_id","extension_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"name_zh" text,
	"system_kind" "system_kind",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"extension_id" text NOT NULL,
	"version" text NOT NULL,
	"source" "install_source" NOT NULL,
	"installed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"uninstalled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"extension_id" text NOT NULL,
	"stars" integer NOT NULL,
	"review" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_user_ext" UNIQUE("user_id","extension_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_dept_id_departments_id_fk" FOREIGN KEY ("dept_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_tags" ADD CONSTRAINT "extension_tags_extension_id_extensions_id_fk" FOREIGN KEY ("extension_id") REFERENCES "public"."extensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_tags" ADD CONSTRAINT "extension_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extension_versions" ADD CONSTRAINT "extension_versions_extension_id_extensions_id_fk" FOREIGN KEY ("extension_id") REFERENCES "public"."extensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_publisher_user_id_users_id_fk" FOREIGN KEY ("publisher_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_owner_org_id_organizations_id_fk" FOREIGN KEY ("owner_org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_dept_id_departments_id_fk" FOREIGN KEY ("dept_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_extension_version_id_extension_versions_id_fk" FOREIGN KEY ("extension_version_id") REFERENCES "public"."extension_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_extension_id_extensions_id_fk" FOREIGN KEY ("extension_id") REFERENCES "public"."extensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installs" ADD CONSTRAINT "installs_extension_id_extensions_id_fk" FOREIGN KEY ("extension_id") REFERENCES "public"."extensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_extension_id_extensions_id_fk" FOREIGN KEY ("extension_id") REFERENCES "public"."extensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_dept_path" ON "departments" USING btree ("id" text_pattern_ops);--> statement-breakpoint
CREATE INDEX "idx_dept_org_parent" ON "departments" USING btree ("org_id","parent_id");--> statement-breakpoint
CREATE INDEX "idx_extension_tags_tag_ext" ON "extension_tags" USING btree ("tag_id","extension_id");--> statement-breakpoint
CREATE INDEX "idx_ext_category" ON "extensions" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_ext_scope" ON "extensions" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "idx_ext_func_sub_l2" ON "extensions" USING btree ("func_cat","sub_cat","l2");--> statement-breakpoint
CREATE INDEX "idx_ext_dept_path" ON "extensions" USING btree ("dept_id" text_pattern_ops);--> statement-breakpoint
CREATE INDEX "idx_ext_visibility" ON "extensions" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_ext_downloads" ON "extensions" USING btree ("downloads_count" DESC);--> statement-breakpoint
CREATE INDEX "idx_ext_stars" ON "extensions" USING btree ("stars_avg" DESC);--> statement-breakpoint
CREATE INDEX "idx_installs_user_ext" ON "installs" USING btree ("user_id","extension_id");