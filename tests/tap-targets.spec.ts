import { test, expect, PUBLIC_ROUTES, gotoMobile } from "./helpers";

const MIN = 44; // WCAG 2.5.5 / iOS HIG minimum touch target, px

for (const route of PUBLIC_ROUTES) {
  test(`${route.name} (${route.path}): interactive elements are at least ${MIN}px`, async ({ page }) => {
    await gotoMobile(page, route.path);

    const small = await page.evaluate((min) => {
      const sel = 'a[href], button, [role="button"], input:not([type="hidden"]), select, textarea, [role="tab"], [role="switch"], [role="checkbox"]';
      const out: { tag: string; label: string; w: number; h: number }[] = [];

      for (const el of Array.from(document.querySelectorAll(sel))) {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) continue;

        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;

        // An ::after overlay (the .tap-44 utility) is the real hit area when
        // it is larger than the painted element.
        const after = getComputedStyle(el, "::after");
        const aw = parseFloat(after.width);
        const ah = parseFloat(after.height);
        if (after.content !== "none" && aw >= min && ah >= min) continue;

        // An element inside a larger interactive parent inherits its hit area.
        const wrapper = el.parentElement?.closest('a[href], button, [role="button"]');
        if (wrapper && wrapper !== el) {
          const wr = wrapper.getBoundingClientRect();
          if (wr.width >= min && wr.height >= min) continue;
        }

        if (r.width < min || r.height < min) {
          out.push({
            tag: el.tagName.toLowerCase(),
            label:
              (el.getAttribute("aria-label") ||
                el.getAttribute("title") ||
                el.textContent?.trim() ||
                el.getAttribute("placeholder") ||
                "")
                .slice(0, 40),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      }
      return out;
    }, MIN);

    expect(small, `tap targets under ${MIN}px:\n${JSON.stringify(small, null, 2)}`).toHaveLength(0);
  });
}
