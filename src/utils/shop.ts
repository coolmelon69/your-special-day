/**
 * Shop catalogue. Pure data — every SKU here is a cosmetic unlock recorded in
 * `profiles.purchases`, applied by whichever component owns that surface.
 *
 * Prices live in TWO places on purpose: here for display, and inside the
 * `buy_sku` SQL function for the actual charge. The client never tells the
 * database what something costs. Keep the two in step — `shop.check.ts`
 * exists so a drifted price is a failed check rather than a free purchase.
 */

export type ShopCategory = "card" | "sticker" | "filter" | "coupon";

export interface ShopSku {
  id: string;
  category: ShopCategory;
  name: string;
  blurb: string;
  price: number;
}

export const SHOP_CATALOGUE: ShopSku[] = [
  // Trainer card — worn on /trainer-card, the tab next door
  {
    id: "card.material.holo",
    category: "card",
    name: "Holo Finish",
    blurb: "The real thing. Tilt it and the art window catches the light.",
    price: 50,
  },
  {
    id: "card.material.foil",
    category: "card",
    name: "Foil Finish",
    blurb: "Brushed metal across the name band.",
    price: 30,
  },
  {
    id: "card.frame.sakura",
    category: "card",
    name: "Sakura Frame",
    blurb: "Petals along the card rim.",
    price: 25,
  },
  {
    id: "card.frame.starfield",
    category: "card",
    name: "Starfield Frame",
    blurb: "Slow stars drifting behind the portrait.",
    price: 25,
  },
  {
    id: "card.title",
    category: "card",
    name: "Custom Title",
    blurb: "A line under your name that only you get to have.",
    price: 30,
  },

  // Stickers & photo — met every time the camera opens
  {
    id: "sticker.pack.snacks",
    category: "sticker",
    name: "Snack Pack",
    blurb: "Boba, ramen, cake, ice cream.",
    price: 15,
  },
  {
    id: "sticker.pack.cats",
    category: "sticker",
    name: "Cat Pack",
    blurb: "Four cats, four moods.",
    price: 15,
  },
  {
    id: "sticker.pack.celestial",
    category: "sticker",
    name: "Celestial Pack",
    blurb: "Moon, comet, constellation, planet.",
    price: 15,
  },
  {
    id: "filter.polaroid",
    category: "filter",
    name: "Polaroid",
    blurb: "White border, soft bloom.",
    price: 20,
  },
  {
    id: "filter.disposable",
    category: "filter",
    name: "Disposable Cam",
    blurb: "Grain, flash falloff, orange date stamp.",
    price: 20,
  },
];

export const skuById = (id: string): ShopSku | undefined =>
  SHOP_CATALOGUE.find((sku) => sku.id === id);

export const priceOf = (id: string): number | null => skuById(id)?.price ?? null;

/** Display-side affordability. The database re-checks this — see `buy_sku`. */
export const canAfford = (coins: number, id: string): boolean => {
  const price = priceOf(id);
  return price !== null && coins >= price;
};

export const isOwned = (purchases: string[], id: string): boolean => purchases.includes(id);
