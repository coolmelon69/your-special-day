export type ItemDetails = {
  name: string;
  spriteUrl: string | null;
  flavorText: string | null;
};

export const CHECKPOINT_ITEM_MAP: Record<string, string> = {
  "Breakfast Quest": "oran-berry",
  "Flower Gathering": "sun-stone",
  "Feast Time": "sitrus-berry",
  "Memory Capture": "heart-scale",
  "Melody Hour": "lucky-egg",
  "Starlight Banquet": "star-piece",
};

export const ITEM_POOL: string[] = Object.values(CHECKPOINT_ITEM_MAP);

export const getItemSlugForCheckpoint = (title: string, index: number): string => {
  const mapped = CHECKPOINT_ITEM_MAP[title];
  if (mapped) return mapped;
  return ITEM_POOL[index % ITEM_POOL.length];
};

export type Rarity = "common" | "rare";

export const RARE_POOL: string[] = ["rare-candy", "shiny-charm", "master-ball"];

/** Odds a non-finale checkpoint upgrades to a rare. */
export const RARE_CHANCE = 0.15;

export const COINS_BY_RARITY: Record<Rarity, number> = { common: 10, rare: 25 };

export interface Drop {
  slug: string;
  rarity: Rarity;
  coins: number;
}

/**
 * Decide what a checkpoint drops.
 *
 * The last checkpoint of the journey is *always* rare. At a flat 15% across
 * six stops there is a 38% chance of seeing no rare at all — better than one
 * day in three where the rare reveal never plays. Guaranteeing the finale
 * costs one branch and makes the last stop land like an ending.
 *
 * Called once per checkpoint: `record_drop` refuses a second payout for the
 * same source, so a re-roll can never overwrite what she already got.
 * `rng` is injectable for the self-check.
 */
export const rollDrop = (
  title: string,
  index: number,
  isFinale: boolean,
  rng: () => number = Math.random,
): Drop => {
  const roll = rng();
  const isRare = isFinale || roll < RARE_CHANCE;

  if (!isRare) {
    return { slug: getItemSlugForCheckpoint(title, index), rarity: "common", coins: COINS_BY_RARITY.common };
  }

  // Reuse the same roll to pick which rare — one source of randomness, so the
  // self-check can drive the whole decision with a single stubbed value.
  const rareSlug = RARE_POOL[Math.floor(roll * RARE_POOL.length * 1000) % RARE_POOL.length];
  return { slug: rareSlug, rarity: "rare", coins: COINS_BY_RARITY.rare };
};

const itemDetailsCache = new Map<string, ItemDetails>();

type PokeApiFlavorEntry = { language: { name: string }; text: string };
type PokeApiItemResponse = {
  name: string;
  sprites?: { default?: string | null };
  flavor_text_entries?: PokeApiFlavorEntry[];
};

export const fetchItemDetails = async (slug: string): Promise<ItemDetails> => {
  const cached = itemDetailsCache.get(slug);
  if (cached) return cached;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/item/${slug}`);
    if (!response.ok) {
      throw new Error(`PokéAPI item fetch failed: ${response.status}`);
    }
    const data = (await response.json()) as PokeApiItemResponse;
    const englishEntry = (data.flavor_text_entries ?? []).find(
      (entry) => entry.language.name === "en",
    );
    const details: ItemDetails = {
      name: data.name,
      spriteUrl: data.sprites?.default ?? null,
      flavorText: englishEntry?.text?.replace(/\f/g, " ") ?? null,
    };
    itemDetailsCache.set(slug, details);
    return details;
  } catch {
    // Network/parse failure: delight feature, not critical path — fall back silently.
    return { name: slug, spriteUrl: null, flavorText: null };
  }
};
