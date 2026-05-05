import { test, expect } from "@playwright/test";

test.describe("App shell and navigation", () => {
  test("home page loads with AgentCenter logo in the header", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("banner")).toBeVisible();
    // The logo link points to "/"
    await expect(page.locator("header a[href='/en']").first()).toBeVisible();
  });

  test("search form is present in the top bar", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("header input[type='search']")).toBeVisible();
  });

  test("searching navigates to the extensions browse page with q param", async ({ page }) => {
    await page.goto("/en");
    await page.locator("header input[type='search']").fill("web search");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/en\/extensions/);
    await expect(page).toHaveURL(/q=web/);
  });

  test("explore nav link navigates to /extensions", async ({ page }) => {
    await page.goto("/en");
    await page.locator("header nav a[href='/en/extensions']").click();
    await expect(page).toHaveURL(/\/en\/extensions/);
  });

  test("publish nav link navigates to /publish", async ({ page }) => {
    await page.goto("/en");
    await page.locator("header nav a[href='/en/publish']").click();
    await expect(page).toHaveURL(/\/en\/publish/);
  });
});
