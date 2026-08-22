import { test, expect, PUBLIC_ROUTES, gotoMobile } from "./helpers";

// Elements allowed to exceed the viewport because they scroll inside their own
// container (carousels, horizontal chip rows) or are deliberately off-screen.
const OVERFLOW_TOLERANCE = 2; // px, covers sub-pixel rounding

for (const route of PUBLIC_ROUTES) {
  test.describe(`${route.name} (${route.path})`, () => {
    test("does not scroll horizontally", async ({ page }) => {
      await gotoMobile(page, route.path);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(
        scrollWidth,
        `page scrolls horizontally: ${scrollWidth}px content in ${clientWidth}px viewport`
      ).toBeLessThanOrEqual(clientWidth + OVERFLOW_TOLERANCE);
    });

    test("no visible element spills past the viewport", async ({ page }) => {
      await gotoMobile(page, route.path);

      const offenders = await page.evaluate((tol) => {
        const vw = document.documentElement.clientWidth;
        const bad: { tag: string; cls: string; left: number; right: number }[] = [];

        const scrollsHorizontally = (el: Element) => {
          const s = getComputedStyle(el);
          return ["auto", "scroll", "hidden"].includes(s.overflowX);
        };

        for (const el of Array.from(document.body.querySelectorAll("*"))) {
          const style = getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") continue;
          if (style.position === "fixed" && parseFloat(style.opacity) === 0) continue;

          // Inside a horizontally scrollable ancestor, spilling is intentional.
          let parent = el.parentElement;
          let clipped = false;
          while (parent && parent !== document.body) {
            if (scrollsHorizontally(parent)) { clipped = true; break; }
            parent = parent.parentElement;
          }
          if (clipped) continue;

          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.right > vw + tol || r.left < -tol) {
            bad.push({
              tag: el.tagName.toLowerCase(),
              cls: (el.className?.toString() || "").slice(0, 80),
              left: Math.round(r.left),
              right: Math.round(r.right),
            });
          }
        }
        return bad.slice(0, 10);
      }, OVERFLOW_TOLERANCE);

      expect(offenders, `elements outside viewport:\n${JSON.stringify(offenders, null, 2)}`)
        .toHaveLength(0);
    });

    test("bottom navigation stays visible and fixed", async ({ page }) => {
      await gotoMobile(page, route.path);

      const nav = page.locator("nav").last();
      if ((await nav.count()) === 0) test.skip(true, "page renders no nav");

      await expect(nav).toBeVisible();

      const before = await nav.boundingBox();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      const after = await nav.boundingBox();

      expect(before).not.toBeNull();
      expect(after).not.toBeNull();
      expect(
        Math.abs((after!.y ?? 0) - (before!.y ?? 0)),
        "nav moved when the page scrolled — it is not pinned"
      ).toBeLessThan(4);
    });
  });
}
