/**
 * The shop shelf, priced by hand.
 *
 * Three things per item — what it costs, how many are left, and the real-life
 * promise it's redeemed for. The slug list itself isn't editable here: the shop
 * can only render the 36 items the client knows about, so adding one is a code
 * change and a migration, not a form.
 *
 * Rows collapse to price and stock because those are the edits that actually
 * happen; the promise is a paragraph and lives one tap in. Saving is per row —
 * a single Save over 36 items would make every price a pending change until the
 * whole page was right, and pricing one berry shouldn't wait on that.
 */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Boxes,
  ChevronDown,
  Gift,
  Infinity as InfinityIcon,
  PackageX,
  RotateCcw,
  Save,
  Search,
  Store,
  TriangleAlert,
} from "lucide-react";
import PokeCoin from "@/components/PokeCoin";
import { ITEM_SHOP_POOL, SHELF_ORDER, tierOf, type ShelfTier } from "@/utils/itemShop";
import { actionFor } from "@/utils/itemActions";
import { loadItemShop, saveItemShopRow, type ItemShopConfig } from "@/utils/itemShopConfig";
import { fetchItemDetails, type ItemDetails } from "@/utils/pokeItems";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5";

const TIER_LABEL: Record<ShelfTier, string> = {
  pocket: "Pocket money",
  saving: "Worth saving for",
  prime: "The good stuff",
};

/** What a shelf's price band opens, so the pricing decision carries its
 *  consequence: moving an item across a boundary re-gates it. */
const TIER_NOTE: Record<ShelfTier, string> = {
  pocket: "Under 9 coins — open from level 1.",
  saving: "9 to 16 coins — opens at level 2.",
  prime: "17 coins and up — opens at level 3.",
};

/** The editable fields as text, because "no stock limit" is an empty box and a
 *  half-typed price is a string. Parsed on save, never on keystroke. */
interface Draft {
  price: string;
  stock: string;
  action: string;
}

interface Row {
  slug: string;
  name: string;
  price: number;
  stock: number | null;
  action: string | null;
  /** The promise from `itemActions.ts`, shown as the placeholder so clearing the
   *  box visibly falls back to it rather than to nothing. */
  fallbackAction: string;
  detail: ItemDetails | undefined;
}

const draftOf = (row: Row): Draft => ({
  price: String(row.price),
  stock: row.stock === null ? "" : String(row.stock),
  action: row.action ?? "",
});

const ShopManager = () => {
  const [config, setConfig] = useState<ItemShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<Record<string, ItemDetails>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadItemShop().then((loaded) => {
      if (cancelled) return;
      setConfig(loaded);
      setLoading(false);
    });
    fetchAllDetails().then((entries) => {
      if (!cancelled) setDetails(entries);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: Row[] = useMemo(() => {
    const merged = ITEM_SHOP_POOL.map((item) => {
      const live = config?.[item.slug];
      return {
        slug: item.slug,
        name: (details[item.slug]?.name ?? item.slug).replace(/-/g, " "),
        price: live?.price ?? item.price,
        stock: live?.stock ?? null,
        action: live?.action ?? null,
        fallbackAction: actionFor(item.slug)?.action ?? "",
        detail: details[item.slug],
      };
    });
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? merged.filter((row) => row.name.toLowerCase().includes(needle) || row.slug.includes(needle))
      : merged;
    return matched.sort((a, b) => a.price - b.price || a.slug.localeCompare(b.slug));
  }, [config, details, query]);

  const patch = (slug: string, row: Row, next: Partial<Draft>) => {
    setSavedSlug(null);
    setDrafts((current) => ({ ...current, [slug]: { ...(current[slug] ?? draftOf(row)), ...next } }));
  };

  const revert = (slug: string) => {
    setSavedSlug(null);
    setDrafts((current) => {
      const { [slug]: _dropped, ...rest } = current;
      return rest;
    });
  };

  const handleSave = async (row: Row) => {
    const draft = drafts[row.slug];
    if (!draft) return;
    const price = Number(draft.price);
    const stock = draft.stock.trim() === "" ? null : Number(draft.stock);
    if (!Number.isInteger(price) || price < 1) return;
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) return;

    setSavingSlug(row.slug);
    try {
      const result = await saveItemShopRow(row.slug, {
        price,
        stock,
        action: draft.action.trim() || null,
      });
      if (result === "ok") {
        setConfig((current) => ({
          ...(current ?? {}),
          [row.slug]: { slug: row.slug, price, stock, action: draft.action.trim() || null },
        }));
        revert(row.slug);
        setSavedSlug(row.slug);
        window.setTimeout(() => setSavedSlug((s) => (s === row.slug ? null : s)), 2400);
      } else if (result === "no-table") {
        setConfig(null);
        alert("The shelf table isn't there yet. Run sql/2026-08-16-item-shop-config.sql in Supabase, then try again.");
      } else if (result === "forbidden") {
        alert("Only the pair owner can price the shop. Sign in as the account that created the invite.");
      } else {
        alert("Could not save that item. Please try again.");
      }
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Shop shelf</h2>
        <p className="text-sm text-muted-foreground mt-1">
          What each item costs, how many are left to sell, and the promise it's redeemed for. Price
          decides which shelf it sits on, and a shelf is what a level unlocks.
        </p>
      </div>

      {!loading && !config && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-destructive" />
          <p className="text-sm text-foreground">
            Couldn't read the shelf from the database, so these are the prices built into the app and
            nothing saved here will stick. If this is the first time, run{" "}
            <code className="font-mono text-xs">sql/2026-08-16-item-shop-config.sql</code> in Supabase.
          </p>
        </div>
      )}

      {/* Find one. Thirty-six items is a long scroll when you came here to
          reprice a single berry. */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find an item"
          aria-label="Find an item"
          className={cn(inputCls, "pl-9")}
        />
      </div>

      {loading ? (
        <p className="py-10 text-center font-sans text-sm text-muted-foreground">Reading the shelf…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <Store className="mx-auto w-4 h-4 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing on the shelf matches “{query.trim()}”.
          </p>
        </div>
      ) : (
        SHELF_ORDER.map((tier) => {
          const shelf = rows.filter((row) => tierOf(row.price) === tier);
          if (shelf.length === 0) return null;
          return (
            <section key={tier} className="space-y-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {TIER_LABEL[tier]}
                </h3>
                <p className="font-sans text-xs text-muted-foreground">{TIER_NOTE[tier]}</p>
              </div>

              <div className="space-y-2">
                {shelf.map((row) => {
                  const draft = drafts[row.slug];
                  const value = draft ?? draftOf(row);
                  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(draftOf(row));
                  const priceValid = Number.isInteger(Number(value.price)) && Number(value.price) >= 1;
                  const stockValid =
                    value.stock.trim() === "" ||
                    (Number.isInteger(Number(value.stock)) && Number(value.stock) >= 0);
                  const soldOut = row.stock === 0;
                  const open = openSlug === row.slug;

                  return (
                    <div
                      key={row.slug}
                      className={cn(
                        "rounded-xl border p-3 transition-colors",
                        dirty ? "border-primary/40 bg-primary/[0.03]" : "border-border",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {row.detail?.spriteUrl ? (
                          <img
                            src={row.detail.spriteUrl}
                            alt=""
                            width={40}
                            height={40}
                            className={cn("flex-shrink-0", soldOut && "opacity-60 grayscale")}
                            style={{ imageRendering: "pixelated" }}
                          />
                        ) : (
                          <div className="w-10 h-10 flex-shrink-0 rounded-md bg-muted" aria-hidden />
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium capitalize text-foreground">
                            {row.name}
                          </p>
                          <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                            <span className="truncate">{row.slug}</span>
                            {soldOut && (
                              <span className="inline-flex flex-shrink-0 items-center gap-1 uppercase tracking-wide text-rose">
                                <PackageX className="w-4 h-4" />
                                Sold out
                              </span>
                            )}
                            {row.action && (
                              <span className="inline-flex flex-shrink-0 items-center gap-1 uppercase tracking-wide text-primary">
                                <Gift className="w-4 h-4" />
                                Custom
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <label className="sr-only" htmlFor={`price-${row.slug}`}>
                            {row.name} price in coins
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2">
                              <PokeCoin size={14} />
                            </span>
                            <input
                              id={`price-${row.slug}`}
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={value.price}
                              onChange={(e) => patch(row.slug, row, { price: e.target.value })}
                              className={cn(
                                inputCls,
                                "w-[86px] pl-8 font-mono tabular-nums",
                                !priceValid && "border-destructive focus:border-destructive",
                              )}
                            />
                          </div>

                          <label className="sr-only" htmlFor={`stock-${row.slug}`}>
                            {row.name} stock — leave empty for unlimited
                          </label>
                          <div className="relative">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {value.stock.trim() === "" ? (
                                <InfinityIcon className="w-4 h-4" />
                              ) : (
                                <Boxes className="w-4 h-4" />
                              )}
                            </span>
                            <input
                              id={`stock-${row.slug}`}
                              type="number"
                              min={0}
                              inputMode="numeric"
                              placeholder="∞"
                              value={value.stock}
                              onChange={(e) => patch(row.slug, row, { stock: e.target.value })}
                              className={cn(
                                inputCls,
                                "w-[86px] pl-8 font-mono tabular-nums",
                                !stockValid && "border-destructive focus:border-destructive",
                              )}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setOpenSlug(open ? null : row.slug)}
                            aria-expanded={open}
                            aria-controls={`promise-${row.slug}`}
                            aria-label={`${open ? "Hide" : "Edit"} the promise for ${row.name}`}
                            className="grid h-9 w-9 place-items-center rounded-[10px] border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15"
                          >
                            <ChevronDown
                              className={cn("w-4 h-4 transition-transform", open && "rotate-180")}
                            />
                          </button>
                        </div>
                      </div>

                      {open && (
                        <div id={`promise-${row.slug}`} className="mt-3 border-t border-border pt-3">
                          <label className={labelCls} htmlFor={`action-${row.slug}`}>
                            <span className="inline-flex items-center gap-2">
                              <Gift className="w-4 h-4 text-rose" />
                              Redeem for
                            </span>
                          </label>
                          <textarea
                            id={`action-${row.slug}`}
                            rows={2}
                            value={value.action}
                            placeholder={row.fallbackAction}
                            onChange={(e) => patch(row.slug, row, { action: e.target.value })}
                            className={cn(inputCls, "resize-y leading-relaxed")}
                          />
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            One finishable thing, in your own words. Leave it empty to use the
                            built-in promise shown here in grey.
                          </p>
                        </div>
                      )}

                      {(dirty || savedSlug === row.slug) && (
                        <div className="mt-3 flex items-center justify-end gap-2 border-t border-border pt-3">
                          {savedSlug === row.slug && !dirty ? (
                            <p className="inline-flex items-center gap-2 font-sans text-xs text-rose">
                              <Save className="w-4 h-4" />
                              Saved — the shop is showing this now.
                            </p>
                          ) : (
                            <>
                              {!priceValid && (
                                <p className="mr-auto font-sans text-xs text-destructive">
                                  A price is a whole number of coins, 1 or more.
                                </p>
                              )}
                              {priceValid && !stockValid && (
                                <p className="mr-auto font-sans text-xs text-destructive">
                                  Stock is a whole number, or empty for unlimited.
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={() => revert(row.slug)}
                                className="inline-flex items-center gap-2 rounded-[10px] border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground focus:outline-none focus:ring-2 focus:ring-primary/15"
                              >
                                <RotateCcw className="w-4 h-4" />
                                Revert
                              </button>
                              <motion.button
                                type="button"
                                onClick={() => handleSave(row)}
                                disabled={!priceValid || !stockValid || savingSlug === row.slug}
                                whileTap={{ scale: 0.97 }}
                                className="inline-flex items-center gap-2 rounded-[10px] border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {savingSlug === row.slug ? "Saving…" : "Save"}
                              </motion.button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
};

/** Sprites and proper names for the whole catalogue. `fetchItemDetails` caches
 *  by slug, so this is one network pass for the panel's lifetime. */
const fetchAllDetails = async (): Promise<Record<string, ItemDetails>> => {
  const entries = await Promise.all(
    ITEM_SHOP_POOL.map((item) => fetchItemDetails(item.slug).then((d) => [item.slug, d] as const)),
  );
  return Object.fromEntries(entries);
};

export default ShopManager;
