import { test, expect } from "@playwright/test";

/**
 * The site password is an admin toggle. With it OFF, every page is open — so
 * the navigation bar must offer every page. It used to read only the unlock
 * session, which no visitor has when the password is off, and collapsed to the
 * single Cafés link even though the whole site was reachable.
 *
 * Deliberately NOT using tests/helpers.ts: that seeds `site-lock-session`, the
 * very flag whose absence this regression is about.
 */

/** Stub the one global row the site-lock toggle is read from. */
async function stubSiteLock(page: import("@playwright/test").Page, enabled: boolean) {
  await page.route("**/rest/v1/global_admin_settings*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "global",
        disabled_default_stamps: [],
        disabled_default_coupons: [],
        trainer_card_enabled: true,
        site_lock_enabled: enabled,
        last_modified: new Date().toISOString(),
      }),
    });
  });
}

/** The nav folds into a sheet below lg, which is every device project here. */
async function openMenu(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("password off: nav offers the whole site, not just Cafés", async ({ page }) => {
  await stubSiteLock(page, false);
  await page.goto("/");
  await page.waitForLoadState("networkidle").catch(() => {});

  // No lockscreen: the password is off, so the home page itself is showing.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByPlaceholder(/password/i)).toHaveCount(0);

  await openMenu(page);
  const menu = page.getByRole("dialog");
  for (const label of ["Home", "Stamps", "Coupons", "Scan QR", "Memory Book", "Cafés"]) {
    await expect(menu.getByRole("link", { name: label })).toBeVisible();
  }
});

test("password on, session not unlocked: lockscreen, café-only nav", async ({ page }) => {
  await stubSiteLock(page, true);
  await page.addInitScript(() => sessionStorage.removeItem("site-lock-session"));
  await page.goto("/cafes");
  await page.waitForLoadState("networkidle").catch(() => {});

  await openMenu(page);
  const menu = page.getByRole("dialog");
  await expect(menu.getByRole("link", { name: "Cafés" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Stamps" })).toHaveCount(0);
  await expect(menu.getByRole("link", { name: "Home" })).toHaveCount(0);
});
