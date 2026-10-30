import { expect, test } from "@playwright/test";

test("landing explains the product and links to sign-up", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Decide the week once");
  await expect(page.getByRole("link", { name: /Plan my week, free/ })).toHaveAttribute("href", "/sign-up");
  await expect(page.getByText(/Swiggy|Instamart/)).toHaveCount(0);
});

test("private pages redirect to sign-in and keep the destination", async ({ page }) => {
  await page.goto("/plan");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fplan$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});

test("security headers are set", async ({ request }) => {
  const res = await request.get("/sign-in");
  const csp = res.headers()["content-security-policy"];
  expect(csp).toContain("script-src 'self' 'nonce-");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(res.headers()["x-content-type-options"]).toBe("nosniff");
});

test("market is browsable without an account", async ({ page }) => {
  await page.goto("/market");
  await expect(page.getByRole("heading", { name: /Menus from/ })).toBeVisible();
  await page.getByRole("link", { name: /High-Protein Veg Week/ }).click();
  // First visit compiles the page in dev mode, so allow extra time.
  await expect(page.getByRole("heading", { level: 1, name: "High-Protein Veg Week" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("link", { name: /Use this menu/ })).toHaveAttribute("href", /\/sign-in\?next=%2Fm%2F/);
});

test("sign-up checks the password while you type", async ({ page }) => {
  await page.goto("/sign-up");
  await expect(page.getByRole("checkbox")).toHaveCount(0); // no age checkbox any more
  const rules = page.locator("#password-rules li");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await expect(rules.filter({ hasText: "At least 10 characters" })).toHaveClass(/text-danger/);
  await expect(rules.filter({ hasText: "Letters and numbers" })).toHaveClass(/text-danger/);
  await page.getByLabel("Password", { exact: true }).fill("tastydal2026");
  await expect(rules.filter({ hasText: "At least 10 characters" })).toHaveClass(/text-success/);
  await expect(rules.filter({ hasText: "Letters and numbers" })).toHaveClass(/text-success/);
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Your name").focus();
  await expect(page.getByText("That doesn't look like an email address.")).toBeVisible();
});

test("unknown share links show a friendly 404", async ({ page }) => {
  const res = await page.goto("/m/doesnotexist1");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page isn't on the menu")).toBeVisible();
});

test("home page FAQ opens and links to the new pages work", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Is Planetto free?").click();
  await expect(page.getByText(/Planning, shopping lists, sharing and every menu/)).toBeVisible();
  await page.goto("/creators");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your week of meals");
  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "What we promise" })).toBeVisible();
});

test("sign in opens as a popup over the current page and closes back to it", async ({ page }) => {
  await page.goto("/market");
  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmarket$/);
  const dialog = page.getByRole("dialog", { name: "Sign in" });
  await expect(dialog.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  // The market page is still rendered underneath.
  await expect(page.getByRole("heading", { name: /Menus from/ })).toBeAttached();
  // Switching to sign-up stays in the popup.
  await dialog.getByRole("link", { name: "Create a free account" }).click();
  await expect(page.getByRole("dialog", { name: "Create account" }).getByRole("heading", { name: "Plan your first week" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL(/\/market$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("visiting /sign-in directly shows the full page, not a popup", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
