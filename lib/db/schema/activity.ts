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
import { extensions } from "./extension";

export const installSourceEnum = pgEnum("install_source", ["cli", "web"]);

export const installs = pgTable(
  "installs",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    extensionId: text()
      .notNull()
      .references(() => extensions.id, { onDelete: "cascade" }),
    version: text().notNull(),
    source: installSourceEnum().notNull(),
    installedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    uninstalledAt: timestamp({ withTimezone: true }),
  },
  (t) => [index("idx_installs_user_ext").on(t.userId, t.extensionId)],
);

export const ratings = pgTable(
  "ratings",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    extensionId: text()
      .notNull()
      .references(() => extensions.id, { onDelete: "cascade" }),
    stars: integer().notNull(),
    review: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("rating_user_ext").on(t.userId, t.extensionId)],
);
