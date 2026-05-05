import { test, expect } from "@playwright/test";

test.describe("Extension browse page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/en/extensions");
  });

  test("renders the filter bar with chip buttons", async ({ page }) => {
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Official" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trending" })).toBeVisible();
  });

  test("clicking a filter chip sets the filter URL param", async ({ page }) => {
    await page.getByRole("button", { name: "Official" }).click();
    await expect(page).toHaveURL(/filter=official/);
  });

  test("clicking All clears the filter URL param", async ({ page }) => {
    await page.goto("/en/extensions?filter=official");
    await page.getByRole("button", { name: "All" }).click();
    await expect(page).not.toHaveURL(/filter=/);
  });

  test("clicking Trending sets filter=trending", async ({ page }) => {
    await page.getByRole("button", { name: "Trending" }).click();
    await expect(page).toHaveURL(/filter=trending/);
  });

  test("sort select changes the sort URL param", async ({ page }) => {
    await page.getByRole("combobox").selectOption("stars");
    await expect(page).toHaveURL(/sort=stars/);
  });

  test("sort select: recently added sets sort=recent", async ({ page }) => {
    await page.getByRole("combobox").selectOption("recent");
    await expect(page).toHaveURL(/sort=recent/);
  });

  test("extension cards link to detail pages", async ({ page }) => {
    // Requires seeded data — verifies cards are rendered and linkable
    const card = page.locator("a[href*='/en/extensions/']").first();
    await expect(card).toBeVisible();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/\/en\/extensions\/.+/);
  });
});
