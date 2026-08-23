import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import QRCode from "react-qr-code";
import {
  Check,
  Copy,
  EyeOff,
  Gift,
  Loader2,
  Plus,
  Printer,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  createMysteryGift,
  deleteMysteryGift,
  formatGiftCode,
  generateGiftCode,
  giftQRValue,
  listMyMysteryGifts,
  type MysteryGift,
} from "@/utils/mysteryGifts";

/* One row here is one physical card. The code is generated in the browser so
   the QR can render before the insert comes back; the unique index in
   sql/2026-08-23-mystery-gifts.sql is what actually settles collisions. */

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

const COLOR_PRESETS = [
  { label: "Pink to Rose", value: "from-pink-400 to-rose-500" },
  { label: "Amber to Orange", value: "from-amber-400 to-orange-500" },
  { label: "Purple to Indigo", value: "from-purple-400 to-indigo-500" },
  { label: "Blue to Cyan", value: "from-blue-400 to-cyan-500" },
  { label: "Green to Emerald", value: "from-green-400 to-emerald-500" },
  { label: "Red to Pink", value: "from-red-400 to-pink-500" },
];

const emptyForm = {
  title: "",
  description: "",
  emoji: "🎁",
  color: COLOR_PRESETS[0].value,
  note: "",
};

const MysteryGiftsManager = () => {
  const [gifts, setGifts] = useState<MysteryGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  /** Which gift's QR card is on screen. Toggled from the ledger; a new gift opens its own. */
  const [qrId, setQrId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setGifts(await listMyMysteryGifts());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    const code = generateGiftCode();
    const id = await createMysteryGift(
      code,
      {
        title: form.title.trim(),
        description: form.description.trim(),
        emoji: form.emoji.trim() || "🎁",
        color: form.color,
      },
      form.note.trim()
    );
    setIsSaving(false);

    if (!id) {
      toast({
        variant: "destructive",
        title: "Could not create the gift",
        description: "Nothing was saved. Check the connection and try again.",
      });
      return;
    }

    setForm(emptyForm);
    setIsFormOpen(false);
    setQrId(id);
    await refresh();
    toast({
      title: "Gift sealed",
      description: "Print the card below, then hide it somewhere good.",
    });
  };

  const handleDelete = async (gift: MysteryGift) => {
    if (gift.isClaimed) return;
    if (!window.confirm(`Delete "${gift.payload.title}"? The printed card stops working.`)) return;

    const ok = await deleteMysteryGift(gift.id);
    if (!ok) {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: "It may have just been claimed. Refreshing the list.",
      });
    }
    if (qrId === gift.id) setQrId(null);
    await refresh();
  };

  const handleCopy = async (gift: MysteryGift) => {
    try {
      await navigator.clipboard.writeText(formatGiftCode(gift.code));
      setCopiedId(gift.id);
      window.setTimeout(() => setCopiedId((c) => (c === gift.id ? null : c)), 1600);
    } catch {
      toast({
        variant: "destructive",
        title: "Could not copy",
        description: "Read it off the screen instead.",
      });
    }
  };

  const unclaimed = gifts.filter((g) => !g.isClaimed).length;
  const shown = gifts.find((g) => g.id === qrId) ?? null;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Mystery gifts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A printed card, a sealed coupon. First scan takes it — after that the
            card is spent, even if someone photographs it.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen((open) => !open)}
          className="inline-flex shrink-0 items-center gap-2 rounded-[10px] border border-primary bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-95"
        >
          {isFormOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isFormOpen ? "Cancel" : "New gift"}
        </button>
      </header>

      {/* ─── author a gift ─── */}
      <AnimatePresence initial={false}>
        {isFormOpen && (
          <motion.form
            onSubmit={handleCreate}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-border bg-muted/25 p-5">
              <div>
                <label className={labelCls} htmlFor="gift-title">
                  What it is *
                </label>
                <input
                  id="gift-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Breakfast in bed, once"
                  className={inputCls}
                  maxLength={60}
                  required
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="gift-description">
                  The promise *
                </label>
                <textarea
                  id="gift-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Any morning you like. No warning needed."
                  className={`${inputCls} min-h-[72px] resize-y`}
                  maxLength={160}
                  required
                />
              </div>

              <div className="grid grid-cols-[6rem_1fr] gap-4">
                <div>
                  <label className={labelCls} htmlFor="gift-emoji">
                    Emoji *
                  </label>
                  <input
                    id="gift-emoji"
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    placeholder="🎁"
                    maxLength={2}
                    className={`${inputCls} text-center text-2xl`}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="gift-color">
                    Colour
                  </label>
                  <select
                    id="gift-color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className={inputCls}
                  >
                    {COLOR_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <div
                    className={`mt-2 h-8 rounded-lg border border-border bg-gradient-to-r ${form.color}`}
                  />
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    Kept for the record. The coupons route prints in rose only —
                    see DESIGN_SYSTEM.md §14.
                  </p>
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="gift-note">
                  Private note (only you see this)
                </label>
                <input
                  id="gift-note"
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="the one in the blue envelope"
                  className={inputCls}
                  maxLength={80}
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-rose bg-rose px-4 py-2.5 font-medium text-white transition hover:brightness-95 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                {isSaving ? "Sealing…" : "Seal it and make the code"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ─── the card to print ─── */}
      {shown && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="gift-print-card rounded-2xl border border-rose/40 bg-card p-5 shadow-romantic"
        >
          <div className="flex items-center justify-between gap-3 print:hidden">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-rose">
              QR card
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-[10px] border border-border px-3 py-1.5 text-sm text-foreground transition hover:border-foreground"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button
                type="button"
                onClick={() => setQrId(null)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:border-foreground hover:text-foreground"
              >
                <EyeOff className="h-4 w-4" />
                Hide
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <div className="rounded-xl border border-border bg-white p-3">
              <QRCode value={giftQRValue(shown.code)} size={148} level="Q" />
            </div>
            <div className="min-w-0 text-center sm:text-left">
              <p className="font-serif text-xl font-bold leading-tight text-foreground">
                {shown.payload.emoji} {shown.payload.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {shown.payload.description}
              </p>
              <p className="mt-3 font-mono text-sm tracking-[0.14em] text-foreground">
                {formatGiftCode(shown.code)}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Scan it, or type it in
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─── the ledger ─── */}
      <section>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          {isLoading
            ? "Loading…"
            : `${gifts.length} made · ${unclaimed} still sealed`}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : gifts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <Gift className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-3 font-serif text-lg text-foreground">No gifts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Make one, print the card, leave it where she'll find it.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {gifts.map((gift) => (
              <li
                key={gift.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-border text-lg">
                  {gift.payload.emoji}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {gift.payload.title}
                  </p>
                  <p className="truncate font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
                    {formatGiftCode(gift.code)}
                    {gift.note ? ` · ${gift.note}` : ""}
                  </p>
                </div>

                <span
                  className={`shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] ${
                    gift.isClaimed ? "text-rose" : "text-muted-foreground"
                  }`}
                >
                  {gift.isClaimed && gift.claimedAt
                    ? `opened ${new Date(gift.claimedAt).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                      })}`
                    : "sealed"}
                </span>

                <button
                  type="button"
                  onClick={() => setQrId((id) => (id === gift.id ? null : gift.id))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  aria-pressed={qrId === gift.id}
                  aria-label={
                    qrId === gift.id
                      ? `Hide the QR for ${gift.payload.title}`
                      : `Show the QR for ${gift.payload.title}`
                  }
                  title={qrId === gift.id ? "Hide QR" : "Show QR"}
                >
                  {qrId === gift.id ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(gift)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  aria-label={`Copy the code for ${gift.payload.title}`}
                >
                  {copiedId === gift.id ? (
                    <Check className="h-4 w-4 text-rose" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>

                {/* A claimed gift is in someone's ticket book. Deleting the row
                    would take it back out from under her, so the server refuses
                    and so does this. */}
                <button
                  type="button"
                  onClick={() => handleDelete(gift)}
                  disabled={gift.isClaimed}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
                  aria-label={
                    gift.isClaimed
                      ? `${gift.payload.title} has been opened and cannot be deleted`
                      : `Delete ${gift.payload.title}`
                  }
                  title={gift.isClaimed ? "Already opened — it's hers now" : "Delete"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default MysteryGiftsManager;
