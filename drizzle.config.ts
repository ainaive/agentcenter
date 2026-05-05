import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

// drizzle-kit runs in its own process and doesn't pick up Next.js's .env.local
// loading. Load it manually here so `bun run db:*` scripts work.
const envPath = resolve(".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
