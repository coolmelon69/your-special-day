import { test as base, Page } from "@playwright/test";

// The site lockscreen lives in sessionStorage, which storageState does not
// carry, so every page gets it seeded before any script runs.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("site-lock-session", "true");
    });
    await use(page);
  },
});

export const expect = base.expect;

/** Routes reachable without admin credentials. */
export const PUBLIC_ROUTES = [
  { path: "/", name: "home" },
  { path: "/stamps", name: "stamps" },
  { path: "/coupons", name: "coupons" },
  { path: "/memory-book", name: "memory-book" },
  { path: "/wrapped", name: "wrapped" },
  { path: "/scan-qr", name: "scan-qr" },
  { path: "/redemption-success", name: "redemption-success" },
  { path: "/camera", name: "camera" },
  { path: "/cafes", name: "cafes" },
  { path: "/cafes/achievements", name: "cafe-achievements" },
  { path: "/trainer-card", name: "trainer-card" },
];

/** Navigate and wait for the page to settle past its loading state. */
export async function gotoMobile(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle").catch(() => {});
  // Animations (framer-motion) settle before we measure geometry.
  await page.waitForTimeout(600);
}
