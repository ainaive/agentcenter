import { defineConfig } from "vitest/config";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    // Default environment for lib/ and cli/ unit tests.
    // components/ tests carry a `// @vitest-environment happy-dom` pragma.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Unit tests live next to their source files in lib/ and cli/.
    // components/ client components are tested here too.
    // app/ RSC pages and routes are covered by tests/e2e/ (Playwright).
    include: ["lib/**/*.test.ts", "cli/**/*.test.ts", "components/**/*.test.tsx"],
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
