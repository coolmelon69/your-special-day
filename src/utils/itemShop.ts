/**
 * Buyable Poké items — the shelf next to the cosmetics in the Shop tab.
 *
 * Sprites and flavour text come from PokéAPI at render time (`fetchItemDetails`),
 * so this file carries only what the API can't tell us: which items are for sale
 * and what they cost.
 *
 * The prices below are the *defaults*. Since
 * sql/2026-08-16-item-shop-config.sql they are seed values for the `item_shop`
 * table, which the admin panel edits and `buy_item` charges from — see
 * `itemShopConfig.ts`. They stay here as the fallback for a database that
 * hasn't been migrated, and `itemShop.check.ts` fails if the seed drifts from
 * them. The client still never sends a price to `buy_item`.
 *
 * Bought items are keepsakes at rarity "common": they fill the bag, they never
 * add XP. See the migration's header for why.
 *
 * The whole catalogue is open at once — there is no daily shelf any more. Two
 * things replace the pacing the rotation used to provide: the price tiers below
 * are gated on trainer level, and an item can only be re-bought once the one in
 * the bag has been redeemed (`buy_item` enforces that half).
 */

export interface ItemSku {
  slug: string;
  price: number;
}

export const ITEM_SHOP_POOL: ItemSku[] = [
  { slug: "pecha-berry", price: 5 },
  { slug: "cheri-berry", price: 5 },
  { slug: "rawst-berry", price: 5 },
  { slug: "leppa-berry", price: 5 },
  { slug: "fresh-water", price: 5 },
  { slug: "potion", price: 6 },
  { slug: "sweet-heart", price: 6 },
  { slug: "berry-juice", price: 6 },
  { slug: "honey", price: 6 },
  { slug: "soda-pop", price: 7 },
  { slug: "great-ball", price: 8 },
  { slug: "casteliacone", price: 8 },
  { slug: "moomoo-milk", price: 9 },
  { slug: "lemonade", price: 9 },
  { slug: "super-potion", price: 10 },
  { slug: "escape-rope", price: 10 },
  { slug: "full-heal", price: 11 },
  { slug: "everstone", price: 12 },
  { slug: "exp-share", price: 12 },
  { slug: "metronome", price: 13 },
  { slug: "ultra-ball", price: 14 },
  { slug: "leftovers", price: 14 },
  { slug: "love-ball", price: 15 },
  { slug: "revive", price: 16 },
  { slug: "fire-stone", price: 18 },
  { slug: "water-stone", price: 18 },
  { slug: "thunder-stone", price: 18 },
  { slug: "dawn-stone", price: 19 },
  { slug: "moon-stone", price: 20 },
  { slug: "amulet-coin", price: 20 },
  { slug: "dusk-stone", price: 21 },
  { slug: "soothe-bell", price: 22 },
  { slug: "max-revive", price: 22 },
  { slug: "soul-dew", price: 23 },
  { slug: "destiny-knot", price: 24 },
  { slug: "full-restore", price: 25 },
];

/**
 * The three shelves. Price already sorts the catalogue into "pocket money",
 * "worth saving for" and "the good stuff", so it does double duty: it groups the
 * cards *and* it decides what a trainer has earned the right to buy.
 */
export type ShelfTier = "pocket" | "saving" | "prime";

export const SHELF_ORDER: ShelfTier[] = ["pocket", "saving", "prime"];

export const tierOf = (price: number): ShelfTier =>
  price >= 17 ? "prime" : price >= 9 ? "saving" : "pocket";

/**
 * Minimum `levelNumber` (1-based, from `computeTrainerStats`) each shelf needs.
 *
 * ponytail: gated in the client only. `buy_item` can't check this — level is
 * derived from badges, stamps, visits and rare drops spread across four tables
 * and an admin-tunable weight config, and re-deriving that inside a plpgsql
 * function would be a second implementation to keep in step for a two-person
 * birthday app. Upgrade path if it ever matters: store `level` on `profiles`
 * whenever `computeTrainerStats` runs, and add `and level >= …` to `buy_item`.
 */
export const TIER_MIN_LEVEL: Record<ShelfTier, number> = {
  pocket: 1,
  saving: 2,
  prime: 3,
};

/** Everything on one shelf, cheapest first. */
export const itemsOnShelf = (tier: ShelfTier, pool: ItemSku[] = ITEM_SHOP_POOL): ItemSku[] =>
  pool.filter((item) => tierOf(item.price) === tier).sort((a, b) => a.price - b.price);

/**
 * Cards per page of the shop window, one per grid shape.
 *
 * The grid is three columns on a phone and four from `sm` up, and it is a static
 * grid — a part-filled page shows holes, which is the one thing this window can't
 * do. So each shape gets the page size that fills it exactly: 3×3 and 4×3.
 *
 * Both divide the catalogue evenly (36 = 4×9 = 3×12), and `itemShop.check.ts`
 * fails the moment that stops being true.
 */
export const PAGE_SIZES = { compact: 9, wide: 12 } as const;

/**
 * The whole shelf, cheapest first. Pages are cut straight out of this.
 *
 * `pool` exists so the shop can pass the live, admin-priced catalogue: a repriced
 * item has to move to where its new price puts it, or the shelf headers and the
 * level gates would describe the wrong tiles. Defaults to the built-in prices,
 * which is what an unmigrated database falls back to.
 */
export const catalogue = (pool: ItemSku[] = ITEM_SHOP_POOL): ItemSku[] =>
  [...pool].sort((a, b) => a.price - b.price);

/**
 * The catalogue cut into pages of `perPage`.
 *
 * Pages run straight through the price order rather than breaking at the shelf
 * boundaries: nine and twelve can't both align to a twelve-item shelf, and a full
 * grid matters more than a page holding exactly one shelf. Sorted by price means
 * a page is near enough one tier anyway, and the header names whichever tiers are
 * actually on it. The level gate is per tile for the same reason.
 */
export const pagesOf = (perPage: number, pool: ItemSku[] = ITEM_SHOP_POOL): ItemSku[][] => {
  const items = catalogue(pool);
  return Array.from({ length: Math.ceil(items.length / perPage) }, (_, i) =>
    items.slice(i * perPage, (i + 1) * perPage),
  );
};

export const itemPriceOf = (slug: string): number | null =>
  ITEM_SHOP_POOL.find((item) => item.slug === slug)?.price ?? null;

/** The source key `buy_item` writes — also the "already in the bag" test. */
export const itemSourceFor = (slug: string): string => `shop:${slug}`;
