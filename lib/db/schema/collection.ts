import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { extensions } from "./extension";

export const systemKindEnum = pgEnum("system_kind", ["installed", "saved"]);

export const collections = pgTable("collections", {
  id: text().primaryKey(),
  ownerUserId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text().notNull(),
  nameZh: text(),
  // null for user-created groups; non-null for the auto-managed Installed/Saved
  systemKind: systemKindEnum(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const collectionItems = pgTable(
  "collection_items",
  {
    collectionId: text()
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    extensionId: text()
      .notNull()
      .references(() => extensions.id, { onDelete: "cascade" }),
    addedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.extensionId] })],
);
