import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./auth";

export const membershipRoleEnum = pgEnum("membership_role", [
  "viewer",
  "publisher",
  "admin",
]);

export const organizations = pgTable("organizations", {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  nameZh: text(),
  logoUrl: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const departments = pgTable(
  "departments",
  {
    // Dotted-path identifier (e.g. "eng.cloud.infra"). Load-bearing: the
    // descendant lookup uses LIKE 'parent.%' against this column.
    id: text().primaryKey(),
    orgId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Logical parent id; not a FK constraint to keep self-references simple.
    // The dotted-path id encodes the same structure.
    parentId: text(),
    name: text().notNull(),
    nameZh: text().notNull(),
    pathDepth: integer().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("idx_dept_path").using(
      "btree",
      sql`${t.id} text_pattern_ops`,
    ),
    index("idx_dept_org_parent").on(t.orgId, t.parentId),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: text()
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    deptId: text().references(() => departments.id, {
      onDelete: "set null",
    }),
    role: membershipRoleEnum().notNull().default("viewer"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("memberships_user_org_unique").on(t.userId, t.orgId)],
);
