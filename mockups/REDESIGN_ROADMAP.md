# Redesign Roadmap — Editorial Look, Page by Page

Goal: migrate the live app from the **pixel-art treatment** (Press Start 2P, hard
borders, sprite-only tiles) to the **editorial look** in
[`mockups/redesign-mockup.html`](./redesign-mockup.html) — mixed roman/italic
serif display, `Nº` eyebrows, annotated figures, real lucide icons — **without a
big-bang rewrite**.

Ship one page at a time. Each phase is independently mergeable and reversible.

## Guiding facts (already true in repo — do not re-do)

- Palette already purple HSL tokens in [`src/index.css`](../src/index.css)
  (`--primary: 272 50% 55%`). The mockup's `--accent` ≈ this. **Keep tokens.**
- Serif already wired: `font-serif` = Cormorant Garamond (has italics 1,400–600).
  Mono already wired: `font-mono` = DM Mono. See
  [`tailwind.config.ts`](../tailwind.config.ts) `fontFamily`.
- `lucide-react` already a dependency (used in `StampsPage.tsx`). Use it for all
  mockup icons — do **not** inline raw SVG.
- What actually changes: **drop `font-pixel` usage**, soften hard pixel borders,
  add editorial primitives. Press Start 2P stays available until Phase 4 cleanup.

## Token / mockup mapping (reference)

| Mockup CSS | App equivalent |
|---|---|
| `--accent #9b5cc9` | `hsl(var(--primary))` |
| `--rose #d6679b` | new token `--rose` (add in Phase 0) |
| `--font-display` | `font-serif` (Cormorant Garamond) |
| `--font-mono` | `font-mono` (DM Mono) |
| `--bg / --surface / --border / --muted` | `--background / --card / --border / --muted-foreground` |

---

## Phase 0 — Shared foundations (no visible page change)

**Why first:** every page reuses these. Build once, reuse in Phase 1–2.

**Files**
- `src/index.css` — add `--rose` + `--rose-soft` tokens; add `@layer components`
  utilities: `.eyebrow`, `.display-em` (italic rose), `.dot-accent`, `.figure-cap`,
  `.annotate`, `.dotgrid`, `.stat-num`.
- `tailwind.config.ts` — add `rose` color → `hsl(var(--rose))`.
- `src/components/editorial/` — new shared primitives:
  - `Eyebrow.tsx` — em-dash rule + uppercase mono label + optional `Nº` suffix.
  - `DisplayHeading.tsx` — serif heading; supports `<em>` (rose italic) + `<strong>`
    (bold roman) + trailing `.dot-accent` period.
  - `EditorialFigure.tsx` — image + `annotate` box + dotgrid + mono caption.
  - `StatBlock.tsx` — big serif number + label.
  - `Pill.tsx` — variants: `accent | rose | done | tag`.

**Acceptance**
- Storybook/scratch route renders each primitive matching the mockup.
- No existing page imports them yet → zero visual diff on live pages.

**Risk:** low. Additive only. Rollback = delete folder + token lines.

---

## Phase 1 — StampsPage

Target: [`src/pages/StampsPage.tsx`](../src/pages/StampsPage.tsx) +
[`src/components/StampCollectionSection.tsx`](../src/components/StampCollectionSection.tsx).
Mockup anchor: `#stamps`.

### 1a — Page header → editorial hero-split
- Replace the `bg-gradient-romantic` centered `<h1>` block (StampsPage L317–333)
  with hero-split: `Eyebrow "The Itinerary · Nº 01"` + `DisplayHeading`
  (`Every <em>stop</em> … <strong>a stamp</strong> …`) + lead + CTA buttons, and
  `EditorialFigure` on the right.
- Floating keepsake card = live progress (`completedStamps`/`total`, next stop).
- **Acceptance:** header matches mockup hero; progress count is real, not mocked.

### 1b — Stamp grid cards
- In `StampCollectionSection.tsx`, replace per-card pixel chrome (L180–232: `border-4`,
  corner squares, dot ring) with editorial `.card` + `sprite` tile.
- Map states: done → `card-unlocked` + rose sprite + `Pill done "Stamped"` + checked
  date in mono; pending → dimmed card + `tag "Pending"`; active → accent-border card
  + `tag "Up next"`.
- Keep sprite **emoji/`SpriteComponent`** inside `.sprite` tile; keep evidence-image
  swap (`item.imageUrl`) logic untouched.
- Drop `font-pixel`; titles → sans, time → `Pill`.
- **Keep all animation/particle logic** (slam, sparkle, confetti) — visual skin only.
- **Acceptance:** grid matches mockup; stamp/sparkle/confetti still fire on unlock.

### 1c — Checkpoint modal → editorial panel
- Restyle modal (StampsPage L358–630): swap pixel frame (`border-4`, inner border,
  Press Start text) for `.card` + serif `DisplayHeading` + `Pill`/`tag` row + mono
  memories grid + lucide icon buttons (Navigate / Add photo / Check in = `btn-rose`).
- Keep modal logic, location check, photo capture/editor wiring intact.
- **Acceptance:** modal matches mockup detail panel; check-in + photo flows unchanged.

**Phase 1 done when:** StampsPage visually = mockup `#stamps`, all behaviors
(reload, location check-in, photos, sync) regression-tested.

---

## Phase 2 — CouponsPage

Target: [`src/pages/CouponsPage.tsx`](../src/pages/CouponsPage.tsx) +
[`src/components/GiftCouponsSection.tsx`](../src/components/GiftCouponsSection.tsx) +
[`src/components/3DCouponCard.tsx`](../src/components/3DCouponCard.tsx).
Mockup anchor: `#coupons`.

### 2a — Hero
- Add editorial hero-split above `GiftCouponsSection` (or replace its header
  L478–491): `Eyebrow "The Rewards · Nº 02"` + `DisplayHeading`
  (`Little <em>promises</em>, <strong>wrapped</strong> as coupons`) + lead + figure.
- **Acceptance:** matches mockup coupons hero.

### 2b — Achievements → feature cards
- Replace `AchievementBadge` (GiftCouponsSection L133–199: pixel corners, `font-pixel`)
  with editorial `.feature.card`: lucide `feature-mark` (Compass/Heart/Trophy already
  imported), serif `h3`, muted desc, unlocked → `card-unlocked` + rose mark + date,
  locked → dimmed + lock icon + progress `1/5`.
- Keep DB-driven unlock + micro-celebration `useEffect` logic.
- **Acceptance:** 3 real achievements render correct state; celebrations still fire.

### 2c — Coupon cards
- Decide: restyle `3DCouponCard.tsx` **or** swap for flat editorial `couponart` card
  (recommended — drops the 3D/pixel skin for the editorial look).
- Map: unlocked-redeemable → `card-unlocked` + `btn-rose Redeem`; redeemed → flat +
  `Pill done` + disabled; locked → dimmed grayscale art + lock + `x/y stamps`.
- Use `coupon.emoji` over image art (mockup `.couponart .emoji`).
- Keep `handleRedeem`, `VoucherModal`, progress logic intact.
- **Acceptance:** matches mockup coupon grid; redeem flow + voucher modal unchanged.

### 2d — Closing CTA + footer
- Add CTA strip (mockup `#coupons` end) + confirm shared `Footer` reads editorial.
- **Acceptance:** matches mockup tail.

**Phase 2 done when:** CouponsPage visually = mockup `#coupons`, redeem/achievement/
realtime sync regression-tested.

---

## Phase 3 — Shared chrome consistency

- `NavigationBar.tsx` / `Footer.tsx` → editorial nav (serif logo + heart icon, mono
  links) so Stamps/Coupons don't clash with the rest of the app.
- Sweep other pages (`HomePage`, `MemoryBookPage`, `WrappedPage`) for `font-pixel`
  collisions now that two pages are editorial. Restyle opportunistically.

## Phase 4 — Cleanup

- Remove `font-pixel` from pages migrated; if **no** page uses Press Start 2P,
  drop the Google Fonts link in `index.html` + `pixel` entry in `tailwind.config.ts`.
- Delete dead pixel CSS (`stamp-ink-texture` if unused after Phase 1).
- Remove this mockup folder or move to `docs/` once shipped.

---

## Sequencing & rules

1. **Phase 0 → 1 → 2 → 3 → 4**, in order. 0 before any page.
2. One PR per phase (Phase 1 may split into 1a/1b/1c PRs if large).
3. **Skin only, never logic.** Every phase keeps sync/location/photo/redeem/
   realtime behavior byte-for-byte. Diff should be JSX/className, not handlers.
4. Each PR: screenshot vs. mockup anchor + manual smoke test of that page's flow.
5. Keep palette tokens; only **add** `--rose`. No raw hex in components.

## Per-phase checklist (copy into each PR)

- [ ] Matches mockup anchor (`#stamps` / `#coupons`) at 1440 + mobile widths
- [ ] All `font-pixel` on touched components replaced with serif/sans/mono
- [ ] lucide-react icons (no inline SVG, no emoji-as-icon except sprite tiles)
- [ ] Animations/particles still fire (stamps) / celebrations fire (coupons)
- [ ] Data is real (progress counts, states) — no hardcoded sample values
- [ ] Behavior flows smoke-tested: check-in, photo, redeem, sync
- [ ] No palette regressions; only `--rose` added
