import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/__tests__/**/*.test.ts"],
    env: {
      // Prevents neon() from throwing at import time in unit tests.
      // No real DB connection is made — queries are never executed.
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    },
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/db/schema/**", "lib/jobs/client.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
