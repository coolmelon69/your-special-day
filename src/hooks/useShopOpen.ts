import { useEffect, useState } from "react";
import { loadShopOpen } from "@/utils/itemShopConfig";

/**
 * Is the shop open? The admin's whole-shop switch
 * (sql/2026-08-25-shop-visibility.sql), read once per mount.
 *
 * Starts `true` and stays true on any failure, so a slow or missing read never
 * flashes the tab away from someone mid-tap. The switch is display truth only —
 * `buy_item` reads the same flag inside the transaction that charges, so a shut
 * shop is shut whether or not this hook ever answered.
 *
 * ponytail: a fetch per mounting component, not a context. Two components read
 * it, it changes about as often as an admin opens the panel, and PostgREST is
 * answering a one-row select. Upgrade path if a third reader appears or the
 * flag starts moving during a session: lift it into AdventureContext beside
 * `trainerCardEnabled`, which is the same shape of flag.
 */
export const useShopOpen = (): boolean => {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadShopOpen().then((next) => {
      if (!cancelled) setOpen(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return open;
};
