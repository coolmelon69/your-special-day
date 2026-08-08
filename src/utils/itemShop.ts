/**
 * Buyable Poké items — the shelf next to the cosmetics in the Shop tab.
 *
 * Sprites and flavour text come from PokéAPI at render time (`fetchItemDetails`),
 * so this file carries only what the API can't tell us: which items are for sale
 * and what they cost. Prices are duplicated into `buy_item` in
 * sql/2026-08-08-item-shop-stock.sql on purpose — the client never sends a
 * price. `itemShop.check.ts` fails if the two drift apart.
 *
 * Bought items are keepsakes at rarity "common": they fill the bag, they never
 * add XP. See the migration's header for why.
 */

export interface ItemSku {
  slug: string;
  price: number;
}

export const ITEM_SHOP_POOL: ItemSku[] = [
  { slug: "pecha-berry", price: 5 },
  { slug: "leppa-berry", price: 5 },
  { slug: "potion", price: 6 },
  { slug: "great-ball", price: 8 },
  { slug: "moomoo-milk", price: 9 },
  { slug: "super-potion", price: 10 },
  { slug: "everstone", price: 12 },
  { slug: "ultra-ball", price: 14 },
  { slug: "revive", price: 16 },
  { slug: "fire-stone", price: 18 },
  { slug: "water-stone", price: 18 },
  { slug: "thunder-stone", price: 18 },
  { slug: "moon-stone", price: 20 },
  { slug: "soothe-bell", price: 22 },
];

/** How many of the pool are on the shelf at once. */
export const DAILY_STOCK_SIZE = 5;

/** Step between picks. Coprime with the pool length, so walking the pool by this
 *  stride visits distinct items — that's what stops the shelf showing duplicates. */
const STRIDE = 3;

/** Days since epoch in *local* time. Using the calendar fields rather than
 *  `getTime()` means the shelf turns over at local midnight, not at UTC. */
const dayNumber = (date: Date): number =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);

/**
 * Today's shelf. Deterministic: the same date always yields the same five, so a
 * refresh doesn't reroll the shop out from under a half-made decision.
 */
export const stockForDate = (date: Date = new Date()): ItemSku[] => {
  const pool = ITEM_SHOP_POOL;
  const start = ((dayNumber(date) % pool.length) + pool.length) % pool.length;
  return Array.from(
    { length: Math.min(DAILY_STOCK_SIZE, pool.length) },
    (_, i) => pool[(start + i * STRIDE) % pool.length],
  );
};

export const itemPriceOf = (slug: string): number | null =>
  ITEM_SHOP_POOL.find((item) => item.slug === slug)?.price ?? null;

/** The source key `buy_item` writes — also the "already in the bag" test. */
export const itemSourceFor = (slug: string): string => `shop:${slug}`;
