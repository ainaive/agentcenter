import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests require a running Next.js dev server with a seeded database.
 * Locally: ensure DATABASE_URL is set in .env.local and run `bun run db:seed`.
 * CI: the e2e.yml workflow handles Postgres + seed + server startup automatically.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Locally: auto-start dev server if one isn't already running.
  // In CI: the e2e workflow starts the server before Playwright runs,
  // so reuseExistingServer is true and no command is launched here.
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
