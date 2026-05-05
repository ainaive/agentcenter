import { test, expect } from "@playwright/test";

// These tests require at least one published extension in the seeded database.
test.describe("Extension detail page", () => {
  let detailUrl: string;

  test.beforeAll(async ({ browser }) => {
    // Find a valid detail page URL by navigating the browse listing first.
    const page = await browser.newPage();
    await page.goto("/en/extensions");
    const firstCard = page.locator("a[href*='/en/extensions/']").first();
    await firstCard.waitFor({ state: "visible" });
    detailUrl = (await firstCard.getAttribute("href")) ?? "/en/extensions";
    await page.close();
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

  test("save button is present for authenticated actions", async ({ page }) => {
    await page.goto(detailUrl);
    // SaveButton renders an aria-labeled button for adding to a group
    await expect(page.getByRole("button", { name: /save|group|folder/i })).toBeVisible();
  });
});
