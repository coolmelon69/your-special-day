import { test as setup, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const STATE = "tests/.auth/state.json";

// Logs in through the real AuthModal once, then saves localStorage (where the
// Supabase session lives) for every mobile project to reuse.
setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    throw new Error("TEST_EMAIL / TEST_PASSWORD missing — see .env.test");
  }

  // /cafes is the one route outside the site lockscreen, so the nav (and its
  // login button) is reachable before we have a session.
  await page.goto("/cafes");

  await page.getByTitle("Log in or register").click();
  await page.getByPlaceholder("your@email.com").fill(email);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.locator("form").getByRole("button", { name: "Login" }).click();

  // Supabase writes its session under sb-<ref>-auth-token in localStorage.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          Object.keys(localStorage).some((k) => k.startsWith("sb-") && k.includes("auth-token"))
        ),
      { timeout: 20_000 }
    )
    .toBe(true);

  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  await page.context().storageState({ path: STATE });
});
