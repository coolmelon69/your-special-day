import { supabase } from "@/utils/supabaseClient";
import { getCurrentUser } from "@/utils/auth";
import type { Rarity } from "@/utils/pokeItems";

/** Trainer photos share the `stamp-photos` bucket the app already provisions —
 *  a second bucket would only be a second set of policies to keep in step. */
const PHOTO_BUCKET = "stamp-photos";

export interface Profile {
  userId: string;
  displayName: string;
  birthday: string; // ISO date, "YYYY-MM-DD"
  trainerName: string;
  avatarId: string;
  /** TeamId from `trainerCard.ts`. Null for profiles created before teams existed. */
  teamId: string | null;
  /** Public URL of an uploaded portrait. Null falls back to the emoji avatar. */
  photoUrl: string | null;
  /** ISO timestamp the row was created — the card's "joined" date. */
  createdAt: string | null;
  /** Checkpoint drops, oldest first. Append-only — items are keepsakes, never spent. */
  items: OwnedItem[];
  /** Shop currency. Earned alongside items, spent on `purchases`. */
  coins: number;
  /** Owned cosmetic SKU ids from `shop.ts`. */
  purchases: string[];
  /** Selected `CardMaterial.id` from `trainerCard.ts`, or null for the default look.
   *  Ordinary profile field — the SKU that unlocks it lives in `purchases`, this is
   *  just "which owned one is currently worn." */
  cardMaterial: string | null;
  /** Selected `CardFrame.id` from `trainerCard.ts`, or null for the default look. */
  cardFrame: string | null;
  /** Custom line under the trainer name, unlocked by `card.title`. Null until set. */
  cardTitle: string | null;
}

export interface OwnedItem {
  slug: string;
  rarity: Rarity;
  /** The checkpoint key it dropped from — also the uniqueness key for payouts. */
  source: string;
  /** ISO timestamp, set server-side by `record_drop`. */
  at: string;
}

/** Tolerant read of the `items` jsonb: a malformed row must not blank the bag. */
const parseItems = (raw: unknown): OwnedItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (entry): entry is OwnedItem =>
      !!entry &&
      typeof entry === "object" &&
      typeof (entry as OwnedItem).slug === "string" &&
      typeof (entry as OwnedItem).source === "string",
  );
};

const parsePurchases = (raw: unknown): string[] =>
  Array.isArray(raw) ? raw.filter((entry): entry is string => typeof entry === "string") : [];

export const loadProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "user_id, display_name, birthday, trainer_name, avatar_id, team_id, photo_url, created_at, items, coins, purchases, card_material, card_frame, card_title",
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      userId: data.user_id,
      displayName: data.display_name,
      birthday: data.birthday,
      trainerName: data.trainer_name,
      avatarId: data.avatar_id,
      teamId: data.team_id ?? null,
      photoUrl: data.photo_url ?? null,
      createdAt: data.created_at ?? null,
      items: parseItems(data.items),
      coins: typeof data.coins === "number" ? data.coins : 0,
      purchases: parsePurchases(data.purchases),
      cardMaterial: data.card_material ?? null,
      cardFrame: data.card_frame ?? null,
      cardTitle: data.card_title ?? null,
    };
  } catch (error) {
    console.error("Error loading profile:", error);
    return null;
  }
};

/**
 * Save the editable half of the profile.
 *
 * `items`, `coins` and `purchases` are deliberately absent: they are only ever
 * written by the `record_drop` and `buy_sku` functions. Including them here
 * would let a profile edit held open since before a checkpoint write the old
 * bag and balance back over the new ones.
 */
export const saveProfile = async (profile: Profile): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("profiles").upsert({
      user_id: profile.userId,
      display_name: profile.displayName,
      birthday: profile.birthday,
      trainer_name: profile.trainerName,
      avatar_id: profile.avatarId,
      team_id: profile.teamId,
      photo_url: profile.photoUrl,
      card_material: profile.cardMaterial,
      card_frame: profile.cardFrame,
      card_title: profile.cardTitle,
    });
    return !error;
  } catch (error) {
    console.error("Error saving profile:", error);
    return false;
  }
};

/**
 * Record a checkpoint drop and pay out its coins.
 *
 * `source` is the checkpoint key and the uniqueness key — the database refuses
 * a second payout for the same one, so re-opening a reveal cannot re-roll or
 * double-pay. Returns false when the drop was already recorded (or there is no
 * session), which the caller treats as "already hers", not as an error.
 */
export const recordDrop = async (
  source: string,
  slug: string,
  rarity: Rarity,
): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("record_drop", {
      p_source: source,
      p_slug: slug,
      p_rarity: rarity,
    });
    if (error) {
      console.error("Error recording drop:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error recording drop:", error);
    return false;
  }
};

/**
 * Buy a cosmetic. The price is decided by the database, not sent from here.
 * Returns false for "not enough coins" and for "already owned" — in both cases
 * nothing was charged.
 */
export const buySku = async (sku: string): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("buy_sku", { p_sku: sku });
    if (error) {
      console.error("Error buying sku:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error buying sku:", error);
    return false;
  }
};

/**
 * Buy a Poké item off the shop shelf. Price comes from `buy_item`, never from
 * here. Returns false for "not enough coins" and for "already in the bag" — in
 * both cases nothing was charged.
 */
export const buyItem = async (slug: string): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("buy_item", { p_slug: slug });
    if (error) {
      console.error("Error buying item:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error buying item:", error);
    return false;
  }
};

/**
 * Admin escape hatch: grant coins to the signed-in trainer's own balance.
 * The amount is the only client input — the database rejects anything
 * non-positive or over the 500 cap. Returns false if the grant failed (or
 * there is no session), which the caller treats as "nothing changed".
 */
export const grantCoins = async (amount: number): Promise<boolean> => {
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc("grant_coins", { p_amount: amount });
    if (error) {
      console.error("Error granting coins:", error);
      return false;
    }
    return data === true;
  } catch (error) {
    console.error("Error granting coins:", error);
    return false;
  }
};

/**
 * Upload a portrait for the trainer card. `dataURL` comes straight off a file input
 * reader. Returns the public URL, or null if anything in the chain failed.
 */
export const uploadTrainerPhoto = async (dataURL: string): Promise<string | null> => {
  if (!supabase) return null;

  const user = await getCurrentUser();
  if (!user) return null;

  try {
    const mime = dataURL.split(",")[0].match(/:(.*?);/)?.[1] ?? "image/jpeg";
    const binary = atob(dataURL.split(",")[1]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Timestamped so a replacement never serves the previous portrait from cache.
    const path = `${user.id}/trainer/portrait-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, new Blob([bytes], { type: mime }), { contentType: mime, upsert: true });
    if (error) {
      console.error("Error uploading trainer photo:", error);
      return null;
    }

    return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data?.publicUrl ?? null;
  } catch (error) {
    console.error("Error uploading trainer photo:", error);
    return null;
  }
};
