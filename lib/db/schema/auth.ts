import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Better Auth tables. Drizzle adapter expects these column names; do not rename
// without checking the Better Auth schema reference.

export const localeEnum = ["en", "zh"] as const;
export const themePreferenceEnum = ["ivory", "dark"] as const;

export const users = pgTable("users", {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  name: text(),
  image: text(),
  bio: text(),
  locale: text({ enum: localeEnum }).notNull().default("en"),
  themePreference: text({ enum: themePreferenceEnum }).notNull().default("ivory"),
  // Logical reference to departments.id; FK omitted to keep the auth/org modules
  // acyclic. App code is responsible for keeping this in sync.
  defaultDeptId: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ withTimezone: true }),
  refreshTokenExpiresAt: timestamp({ withTimezone: true }),
  scope: text(),
  password: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
