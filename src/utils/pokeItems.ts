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
