import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    // Unit tests live next to their source files in lib/ and cli/.
    // components/ and app/ are covered by tests/e2e/ (Playwright) — RSC and
    // React components need a DOM environment and different tooling.
    include: ["lib/**/*.test.ts", "cli/**/*.test.ts"],
    env: {
      // Prevents neon() from throwing at import time in unit tests.
      // No real DB connection is made — queries are never executed.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts", "cli/**/*.ts"],
      exclude: ["lib/db/schema/**", "lib/jobs/client.ts", "**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
