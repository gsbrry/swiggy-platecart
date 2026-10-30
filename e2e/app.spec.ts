import { expect, test } from "@playwright/test";

import { NEW_USER_ID, signIn } from "./helpers";

test.describe("signed-in user", () => {
  test.beforeEach(async ({ context }) => signIn(context));

  test("plan shows the week and opens the dish picker", async ({ page, isMobile }) => {
    await page.goto("/plan");
    await expect(page.getByText(/meals planned/)).toBeVisible();
    if (isMobile) await page.getByRole("tab").last().click(); // Sunday is empty in the fixtures
    await page.locator('button[aria-label^="Add"]:visible').first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("searchbox", { name: "Search dishes" })).toBeFocused();
    await dialog.getByRole("searchbox").fill("Masala Dosa");
    await expect(dialog.getByRole("button", { name: /Masala Dosa/ })).toBeVisible();
    await dialog.getByRole("searchbox").fill("Grandma special");
    await expect(dialog.getByRole("button", { name: /Add .Grandma special. as a new dish/ })).toBeVisible();
  });

  test("share sheet offers link, public and private", async ({ page }) => {
    await page.goto("/plan");
    await page.getByRole("button", { name: /^Share/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Anyone with the link")).toBeVisible();
    await expect(dialog.getByText("Public in Market")).toBeVisible();
    await expect(dialog.getByText("Only me")).toBeVisible();
  });

  test("shopping list adds up ingredients for the household", async ({ page }) => {
    await page.goto("/list?range=next7");
    await expect(page.getByRole("heading", { name: "Shopping list" })).toBeVisible();
    await expect(page.getByText(/for 3 people/)).toBeVisible();
    // Checked items sink to the bottom, so address the item by its name rather than position.
    const ingredient = (await page.locator("ul li label span.font-medium").first().innerText()).trim();
    const escaped = ingredient.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const item = page.getByRole("checkbox", { name: new RegExp(`^${escaped} for`, "i") }).first();
    await item.check();
    await expect(item).toBeChecked();
    await expect(page.getByText(/of \d+ left/)).toBeVisible();
  });

  test("dish detail lets you add to plan", async ({ page }) => {
    await page.goto("/dishes");
    await page.getByRole("link", { name: /Rava Upma/ }).click();
    await expect(page.getByRole("heading", { name: "Ingredients" })).toBeVisible();
    await page.getByRole("button", { name: /Add to my plan/ }).click();
    await expect(page.getByRole("dialog").getByLabel("Day")).toBeVisible();
  });

  test("me page shows profile and menus; settings has account deletion", async ({ page }) => {
    await page.goto("/me");
    await expect(page.getByRole("heading", { name: "My menus" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();
    await page.goto("/me/settings");
    await expect(page.getByRole("button", { name: "Delete my account" })).toBeVisible();
  });

  test("no Swiggy or cart leftovers in the app", async ({ page }) => {
    for (const path of ["/today", "/plan", "/dishes", "/market", "/list", "/me", "/me/settings"]) {
      await page.goto(path);
      await expect(page.getByText(/Swiggy|Instamart/i)).toHaveCount(0);
    }
  });
});

test("new users are sent to onboarding first", async ({ context, page }) => {
  await signIn(context, NEW_USER_ID);
  await page.goto("/plan");
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByRole("heading", { name: /What do you eat/ })).toBeVisible();
  const cont = page.getByRole("button", { name: "Continue" });
  await expect(cont).toBeDisabled();
  await page.getByRole("button", { name: /^Veg No meat/ }).click();
  await cont.click();
  await expect(page.getByRole("heading", { name: "Almost done" })).toBeVisible();
});

test.describe("account and dashboard", () => {
  test.beforeEach(async ({ context }) => signIn(context));

  test("signing in lands on Today, and the logo goes to the public home page", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveURL(/\/today$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening), Raphy/);
    await expect(page.getByRole("heading", { name: "On the menu today" })).toBeVisible();
    await page.getByRole("link", { name: "Planetto home page" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("link", { name: "Go to my dashboard" }).first()).toBeVisible();
  });

  test("avatar opens the account menu", async ({ page }) => {
    await page.goto("/today");
    await page.getByRole("button", { name: "Account menu" }).click();
    const menu = page.getByRole("menu");
    for (const item of ["My profile", "My menus", "My dishes", "Settings", "Moderation", "Sign out"]) {
      await expect(menu.getByRole("menuitem", { name: item })).toBeVisible();
    }
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("settings shows photo, food, planning and account sections", async ({ page }) => {
    await page.goto("/me/settings");
    await expect(page.getByRole("button", { name: /Upload photo|Change photo/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Use Google photo" })).toBeVisible();
    await expect(page.getByLabel("Weekday cooking time limit")).toHaveValue("30");
    await expect(page.getByRole("button", { name: "Monday", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("Google · Email and password")).toBeVisible();
  });
});
