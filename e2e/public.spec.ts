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
  await expect(page.getByRole("heading", { level: 1, name: "High-Protein Veg Week" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Use this menu/ })).toHaveAttribute("href", /\/sign-up\?next=\/m\//);
});

test("sign-up form validates before submitting", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill("Asha");
  await page.getByLabel("Email").fill("asha@example.com");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.locator("form p[role=alert]")).toContainText(/10 characters|18 or older/);
});

test("unknown share links show a friendly 404", async ({ page }) => {
  const res = await page.goto("/m/doesnotexist1");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("This page isn't on the menu")).toBeVisible();
});
