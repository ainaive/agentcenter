import { test, expect } from "@playwright/test";

// These tests require at least one published extension in the seeded database.
test.describe("Extension detail page", () => {
  let detailUrl: string;

  test.beforeAll(async ({ browser, baseURL }) => {
    // browser.newPage() opens a fresh context that does NOT inherit the
    // project's baseURL — pass it explicitly so the relative goto resolves.
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await page.goto("/en/extensions");
    const firstCard = page.locator("a[href*='/en/extensions/']").first();
    await firstCard.waitFor({ state: "visible" });
    detailUrl = (await firstCard.getAttribute("href")) ?? "/en/extensions";
    await context.close();
  });

  test("detail page renders the install button", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("button", { name: /install/i })).toBeVisible();
  });

  test("detail page renders the extension name heading", async ({ page }) => {
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("detail page renders the metadata side panel", async ({ page }) => {
    await page.goto(detailUrl);
    // The metadata panel renders license, homepage, etc.
    // At minimum the panel container should be present.
    await expect(page.locator("aside, [data-panel]")).toBeVisible();
  });

  test("save button renders on the detail page", async ({ page }) => {
    // SaveButton is rendered for all visitors; clicking it while logged out
    // redirects to /sign-in. We only assert the button is present here —
    // authenticated flows are covered separately once auth fixtures land.
    await page.goto(detailUrl);
    await expect(page.getByRole("button", { name: /save|group|folder/i })).toBeVisible();
  });
});
