import { sql } from "drizzle-orm";
import {
  bigint,
  customType,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { departments, organizations } from "./org";

// tsvector is a Postgres-native type; Drizzle doesn't ship a built-in helper.
// We declare it as a custom type so the ORM can reference it in WHERE clauses
// via sql``. It is GENERATED ALWAYS (read-only); never written by app code.
const tsvector = customType<{ data: string }>({
  dataType() { return "tsvector"; },
});

export const extensionCategoryEnum = pgEnum("extension_category", [
  "skills",
  "mcp",
  "slash",
  "plugins",
]);

export const extensionScopeEnum = pgEnum("extension_scope", [
  "personal",
  "org",
  "enterprise",
]);

export const extensionBadgeEnum = pgEnum("extension_badge", [
  "official",
  "popular",
  "new",
]);

export const funcCatEnum = pgEnum("func_cat", [
  "workTask",
  "business",
  "tools",
]);

export const visibilityEnum = pgEnum("extension_visibility", [
  "draft",
  "published",
  "archived",
]);

export const versionStatusEnum = pgEnum("version_status", [
  "pending",
  "scanning",
  "ready",
  "rejected",
]);

export const fileScanStatusEnum = pgEnum("file_scan_status", [
  "pending",
  "clean",
  "flagged",
]);

export const extensions = pgTable(
  "extensions",
  {
    id: text().primaryKey(),
    slug: text().notNull().unique(),
    category: extensionCategoryEnum().notNull(),
    badge: extensionBadgeEnum(),
    scope: extensionScopeEnum().notNull(),
    // funcCat/subCat are nullable — the redesigned publish wizard does not
    // collect them; admin curation can backfill or system defaults apply.
    funcCat: funcCatEnum(),
    subCat: text(),
    l2: text(),
    publisherUserId: text().references(() => users.id, {
      onDelete: "set null",
    }),
    ownerOrgId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    deptId: text().references(() => departments.id, { onDelete: "set null" }),
    iconEmoji: text(),
    iconColor: text(),
    visibility: visibilityEnum().notNull().default("draft"),
    // i18n columns
    name: text().notNull(),
    nameZh: text(),
    tagline: text(),
    taglineZh: text(),
    description: text(),
    descriptionZh: text(),
    // Long-form markdown body for the detail page. Not duplicated to ZH yet —
    // most extensions will have an English README, with translations layered
    // on later if needed.
    readmeMd: text(),
    // metadata for detail page sidebar
    homepageUrl: text(),
    repoUrl: text(),
    licenseSpdx: text(),
    compatibilityJson: jsonb(),
    // Permissions captured during publish (network/files/runtime/data, etc.).
    // Surfaced on the detail page so users see what the extension wants.
    permissions: jsonb().notNull().default({}),
    // denormalized counters (updated by jobs)
    downloadsCount: integer().notNull().default(0),
    starsAvg: numeric({ precision: 2, scale: 1 }).notNull().default("0.0"),
    ratingsCount: integer().notNull().default(0),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    searchVector: tsvector("search_vector"),
  },
  (t) => [
    index("idx_ext_category").on(t.category),
    index("idx_ext_scope").on(t.scope),
    index("idx_ext_func_sub_l2").on(t.funcCat, t.subCat, t.l2),
    index("idx_ext_dept_path").using(
      "btree",
      sql`${t.deptId} text_pattern_ops`,
    ),
    index("idx_ext_visibility").on(t.visibility),
    index("idx_ext_downloads").on(sql`${t.downloadsCount} DESC`),
    index("idx_ext_stars").on(sql`${t.starsAvg} DESC`),
  ],
);

export const extensionVersions = pgTable(
  "extension_versions",
  {
    id: text().primaryKey(),
    extensionId: text()
      .notNull()
      .references(() => extensions.id, { onDelete: "cascade" }),
    version: text().notNull(), // semver
    changelog: text(),
    changelogZh: text(),
    manifestJson: jsonb(),
    // Logical reference to files.id; no FK constraint to avoid a circular FK
    // with files.extensionVersionId. App code keeps these consistent.
    bundleFileId: text(),
    status: versionStatusEnum().notNull().default("pending"),
    // Source method chosen during publish: zip (only one wired today), git, cli.
    // Stored as text rather than enum so adding methods doesn't require a migration.
    sourceMethod: text().notNull().default("zip"),
    sourceMeta: jsonb().notNull().default({}),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("ext_version_unique").on(t.extensionId, t.version)],
);

export const files = pgTable("files", {
  id: text().primaryKey(),
  extensionVersionId: text().references(() => extensionVersions.id, {
    onDelete: "set null",
  }),
  r2Key: text().notNull(),
  size: bigint({ mode: "bigint" }).notNull(),
  checksumSha256: text().notNull(),
  mimeType: text(),
  scanStatus: fileScanStatusEnum().notNull().default("pending"),
  scanReport: jsonb(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: text().primaryKey(), // tag key, e.g. "real-time"
  labelEn: text().notNull(),
  labelZh: text().notNull(),
});

export const extensionTags = pgTable(
  "extension_tags",
  {
    extensionId: text()
      .notNull()
      .references(() => extensions.id, { onDelete: "cascade" }),
    tagId: text()
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.extensionId, t.tagId] }),
    index("idx_extension_tags_tag_ext").on(t.tagId, t.extensionId),
  ],
);
