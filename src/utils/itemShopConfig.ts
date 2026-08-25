/**
 * The admin-editable half of the shop shelf.
 *
 * `itemShop.ts` still owns which slugs exist and what they cost by default;
 * this file reads the overrides the admin panel writes into the `item_shop`
 * table (sql/2026-08-16-item-shop-config.sql) and hands them back as a map.
 *
 * Everything here is display truth only. `buy_item` reads the same table itself
 * inside the transaction that charges the coins, so a tab holding a stale price
 * pays the current one — it never gets to send a number of its own.
 */
import { supabase } from "@/utils/supabaseClient";

export interface ItemShopRow {
  slug: string;
  price: number;
  /** How many are left to sell. `null` is unlimited — the seeded state. `0` is
   *  sold out. This is the shelf's supply, not anything in anyone's bag. */
  stock: number | null;
  /** Overrides the promise in `itemActions.ts`. `null` uses the built-in one. */
  action: string | null;
  /** Pulled from sale. Not the same as sold out: `stock: 0` is an empty shelf
   *  the trainer is meant to see, `hidden` is an item that isn't being sold at
   *  all — gone from the shop and refused by `buy_item` and `redeem_item`
   *  alike (sql/2026-08-25-shop-visibility.sql). */
  hidden: boolean;
}

/** Missing table. Postgrest's code for "I have never heard of this relation",
 *  which is what a Supabase project sees until the migration is run. */
const NO_TABLE = "PGRST205";
const MIGRATION_HINT =
  "item_shop table doesn't exist yet. Run sql/2026-08-16-item-shop-config.sql in Supabase.";

/** Missing `hidden` column, i.e. the config migration ran but the visibility one
 *  didn't. Postgrest reports an unknown column, not an unknown table. */
const NO_COLUMN = "42703";
const HIDDEN_HINT =
  "item_shop has no hidden column yet. Run sql/2026-08-25-shop-visibility.sql in Supabase.";
const SETTINGS_HINT =
  "shop_settings table doesn't exist yet. Run sql/2026-08-25-shop-visibility.sql in Supabase.";

export type ItemShopConfig = Record<string, ItemShopRow>;

/**
 * Every editable row, keyed by slug.
 *
 * Returns `null` — not `{}` — when the table isn't there, so the shop can tell
 * "nothing is overridden" apart from "this database hasn't been migrated" and
 * the admin panel can say which. Any other failure is also null: falling back
 * to the prices compiled into the client is always safe, because the database
 * is the one charging.
 */
export const loadItemShop = async (): Promise<ItemShopConfig | null> => {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("item_shop")
      .select("slug, price, stock, action, hidden");

    if (error) {
      if (error.code === NO_TABLE) console.warn(MIGRATION_HINT);
      else if (error.code === NO_COLUMN) console.warn(HIDDEN_HINT);
      else console.error("Error loading item shop config:", error);
      return null;
    }

    return Object.fromEntries(
      (data ?? []).map((row) => [
        row.slug,
        {
          slug: row.slug as string,
          price: row.price as number,
          stock: (row.stock ?? null) as number | null,
          action: (row.action ?? null) as string | null,
          hidden: (row.hidden ?? false) as boolean,
        },
      ]),
    );
  } catch (error) {
    console.error("Error loading item shop config:", error);
    return null;
  }
};

/** Why a save didn't happen, in the three cases that need different words. */
export type SaveShopResult = "ok" | "no-table" | "forbidden" | "error";

/**
 * Write one row. Update, never upsert: the table has no insert policy, so a
 * typo'd slug fails rather than quietly adding an item nothing can render.
 *
 * `stock: null` means unlimited and is a real value — the caller sends it
 * deliberately when the admin clears the field.
 */
export const saveItemShopRow = async (
  slug: string,
  patch: { price: number; stock: number | null; action: string | null; hidden: boolean },
): Promise<SaveShopResult> => {
  if (!supabase) return "error";

  try {
    const { data, error } = await supabase
      .from("item_shop")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("slug", slug)
      .select("slug");

    if (error) {
      if (error.code === NO_TABLE) {
        console.warn(MIGRATION_HINT);
        return "no-table";
      }
      // Same words to the admin as a missing table: some file in sql/ hasn't
      // been run, and the fix is to run it.
      if (error.code === NO_COLUMN) {
        console.warn(HIDDEN_HINT);
        return "no-table";
      }
      console.error("Error saving item shop row:", error);
      return "error";
    }

    // RLS refusing an update is not an error — it matches no rows and returns an
    // empty set. That's the partner half of a pair trying to price the shelf.
    return data && data.length > 0 ? "ok" : "forbidden";
  } catch (error) {
    console.error("Error saving item shop row:", error);
    return "error";
  }
};


/**
 * Is the shop open at all? `false` takes the whole tab off the nav and off
 * /trainer-card — the bag stays, because what she owns is hers.
 *
 * Defaults to open on every failure, including a database that hasn't run
 * sql/2026-08-25-shop-visibility.sql. A read that didn't answer must never be
 * the thing that shuts the shop: `buy_item` re-reads this flag itself, so an
 * optimistic client can only ever show a door the database then refuses.
 */
export const loadShopOpen = async (): Promise<boolean> => {
  if (!supabase) return true;

  try {
    const { data, error } = await supabase
      .from("shop_settings")
      .select("open")
      .eq("id", "shop")
      .single();

    if (error) {
      if (error.code === NO_TABLE) console.warn(SETTINGS_HINT);
      else if (error.code !== "PGRST116") console.error("Error loading shop settings:", error);
      return true;
    }

    return data?.open ?? true;
  } catch (error) {
    console.error("Error loading shop settings:", error);
    return true;
  }
};

/** Open or shut the whole shop. Same three failure words as a row save. */
export const saveShopOpen = async (open: boolean): Promise<SaveShopResult> => {
  if (!supabase) return "error";

  try {
    const { data, error } = await supabase
      .from("shop_settings")
      .update({ open, updated_at: new Date().toISOString() })
      .eq("id", "shop")
      .select("id");

    if (error) {
      if (error.code === NO_TABLE) {
        console.warn(SETTINGS_HINT);
        return "no-table";
      }
      console.error("Error saving shop settings:", error);
      return "error";
    }

    return data && data.length > 0 ? "ok" : "forbidden";
  } catch (error) {
    console.error("Error saving shop settings:", error);
    return "error";
  }
};
