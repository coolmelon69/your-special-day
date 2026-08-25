import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  GripVertical,
  ImagePlus,
  Loader2,
  Printer,
  Square,
  Trash2,
} from "lucide-react";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import GiftPrintCard, { CARD_DESIGNS, type CardDesign } from "@/components/print/GiftPrintCard";
import { DisplayHeading, Eyebrow } from "@/components/editorial";
import { toast } from "@/hooks/use-toast";
import { formatGiftCode, listMyMysteryGifts, type MysteryGift } from "@/utils/mysteryGifts";
import { attachGiftPrintImage, clearGiftPrintImage, type PrintSlot } from "@/utils/giftPrintImages";

/**
 * The print bench: pick the gifts, pick a design for each, lay them on sheets.
 *
 * Two decisions made once, on purpose:
 *
 * - The DESIGN is not stored. It is a decision about one sheet of paper —
 *   the same gift can print as a token today and a roundel next week, and
 *   nothing about the gift changed.
 * - The IMAGES are stored (sql/2026-08-25-gift-print-images.sql). Uploading
 *   is the work; re-doing it on every reprint would be the annoying part.
 *
 * The sheets render through a portal into `document.body` rather than inline.
 * That is what fixes the blank PDF the old admin Print button produced: an
 * absolutely-positioned card inside a framer-motion ancestor has a
 * transformed containing block, so it lands off the first page. A portal has
 * no ancestor to be trapped by, and the print rules in index.css hide every
 * other direct child of `body`.
 */

const PER_SHEET = 4;

/** One card in the run: which gift, printed which way. Order is print order. */
type Row = { id: string; design: CardDesign };

const chunk = <T,>(items: T[], size: number): T[][] =>
  items.reduce<T[][]>((out, item, i) => {
    if (i % size === 0) out.push([]);
    out[out.length - 1].push(item);
    return out;
  }, []);

const PrintGiftsPage = () => {
  const [gifts, setGifts] = useState<MysteryGift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  /** `${giftId}:${slot}` while that one upload is in flight. */
  const [busySlot, setBusySlot] = useState<string | null>(null);
  /** The gift the side panel is showing — whichever one was last touched. */
  const [focusId, setFocusId] = useState<string | null>(null);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [params] = useSearchParams();

  /* Arriving from the admin ledger's Print button: ?ids=a,b preselects those
     gifts in the order they were named. */
  const preselected = params.get("ids");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const list = await listMyMysteryGifts();
      if (cancelled) return;

      setGifts(list);
      setIsLoading(false);

      const wanted = (preselected ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter((id) => list.some((g) => g.id === id));
      if (wanted.length) {
        setRows(wanted.map((id) => ({ id, design: "token" })));
        setFocusId(wanted[0]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preselected]);

  const byId = useMemo(() => new Map(gifts.map((g) => [g.id, g])), [gifts]);
  const selected = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);

  const toggle = (id: string) => {
    setFocusId(id);
    setRows((current) =>
      current.some((r) => r.id === id)
        ? current.filter((r) => r.id !== id)
        : [...current, { id, design: "token" }]
    );
  };

  const setDesign = (id: string, design: CardDesign) => {
    setFocusId(id);
    setRows((current) => current.map((r) => (r.id === id ? { ...r, design } : r)));
  };

  /** Give every selected card the same design — the common case for a batch. */
  const setAllDesigns = (design: CardDesign) =>
    setRows((current) => current.map((r) => ({ ...r, design })));

  const move = (from: number, to: number) =>
    setRows((current) => {
      if (to < 0 || to >= current.length || from === to) return current;
      const next = [...current];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });

  const handleUpload = useCallback(
    async (giftId: string, slot: PrintSlot, file: File | undefined) => {
      if (!file) return;

      setFocusId(giftId);
      setBusySlot(`${giftId}:${slot}`);
      const url = await attachGiftPrintImage(giftId, slot, file);
      setBusySlot(null);

      if (!url) {
        toast({
          variant: "destructive",
          title: "Could not attach that image",
          description: "Nothing was saved. Check the connection and try again.",
        });
        return;
      }

      setGifts((current) =>
        current.map((g) =>
          g.id === giftId ? { ...g, [slot === "hero" ? "printHero" : "printMark"]: url } : g
        )
      );
    },
    []
  );

  const handleClear = useCallback(async (giftId: string, slot: PrintSlot) => {
    setFocusId(giftId);
    setBusySlot(`${giftId}:${slot}`);
    const ok = await clearGiftPrintImage(giftId, slot);
    setBusySlot(null);

    if (!ok) {
      toast({ variant: "destructive", title: "Could not remove that image" });
      return;
    }

    setGifts((current) =>
      current.map((g) =>
        g.id === giftId ? { ...g, [slot === "hero" ? "printHero" : "printMark"]: null } : g
      )
    );
  }, []);

  const cards = rows
    .map((row, i) => ({ row, gift: byId.get(row.id), number: i + 1 }))
    .filter((c): c is { row: Row; gift: MysteryGift; number: number } => !!c.gift);
  const sheets = chunk(cards, PER_SHEET);

  /* What the side panel shows: whatever was touched last, falling back to the
     first card in the run so the panel is never blank while something is
     selected. A gift that only has images uploaded (not ticked) previews too —
     that is the whole point of looking before you commit it to a sheet. */
  const focusGift = (focusId ? byId.get(focusId) : undefined) ?? cards[0]?.gift ?? null;
  const focusDesign = rows.find((r) => r.id === focusGift?.id)?.design ?? "token";
  const focusNumber = cards.findIndex((c) => c.gift.id === focusGift?.id) + 1;

  return (
    <ProtectedRoute>
      <Helmet>
        <title>Print gift cards · Your Special Day</title>
      </Helmet>

      <div className="min-h-screen bg-background px-4 pb-24 pt-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Eyebrow>Mystery gifts</Eyebrow>
          <DisplayHeading as="h1" className="mt-2">
            The print bench
          </DisplayHeading>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
            Tick the gifts to print, pick how each one looks, and drag them into the order they
            should land on the sheet. Four cards to an A4 landscape page. The design is chosen here
            and not remembered; the images are uploaded once and stay with the gift.
          </p>

          {/* Bench on the left, the card you are shaping pinned on the right. */}
          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-start lg:gap-10">
            <div className="min-w-0">
              {/* ─── the ledger ─── */}
              <section>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    {isLoading ? "Loading…" : `${gifts.length} made · ${rows.length} on the sheet`}
                  </p>

                  {rows.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        All as
                      </span>
                      {CARD_DESIGNS.map((d) => (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => setAllDesigns(d.value)}
                          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground"
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching your gifts…
                  </p>
                ) : gifts.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    No gifts yet. Make one in the admin panel and it turns up here to print.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {gifts.map((gift) => {
                      const on = selected.has(gift.id);
                      const row = rows.find((r) => r.id === gift.id);

                      return (
                        <li
                          key={gift.id}
                          className={`rounded-2xl border p-4 transition ${
                            on ? "border-rose/40 bg-card shadow-romantic" : "border-border bg-card/60"
                          }`}
                        >
                          <div className="flex flex-wrap items-start gap-3">
                            {/* The whole title block is the tick — a row this
                                size should not ask you to hit a 24px box. */}
                            <button
                              type="button"
                              onClick={() => toggle(gift.id)}
                              aria-pressed={on}
                              className="group flex min-w-0 flex-1 items-start gap-3 text-left"
                            >
                              <span
                                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-rose transition ${
                                  on ? "border-rose" : "border-border group-hover:border-rose"
                                }`}
                              >
                                {on ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Square className="h-3.5 w-3.5 text-muted-foreground/50" />
                                )}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block font-serif text-lg font-bold leading-tight text-foreground">
                                  {gift.payload.emoji} {gift.payload.title}
                                </span>
                                <span className="mt-0.5 block font-mono text-[11px] tracking-[0.12em] text-muted-foreground">
                                  {formatGiftCode(gift.code)}
                                  {gift.isClaimed ? " · claimed" : ""}
                                </span>
                              </span>

                              <span className="sr-only">
                                {on ? "Remove from the sheet" : "Add to the sheet"}
                              </span>
                            </button>

                            {/* the two image slots */}
                            <div className="flex items-center gap-2">
                              <ImageSlotButton
                                label="Photo"
                                url={gift.printHero}
                                busy={busySlot === `${gift.id}:hero`}
                                onPick={(file) => handleUpload(gift.id, "hero", file)}
                                onClear={() => handleClear(gift.id, "hero")}
                              />
                              <ImageSlotButton
                                label="Mark"
                                url={gift.printMark}
                                busy={busySlot === `${gift.id}:mark`}
                                onPick={(file) => handleUpload(gift.id, "mark", file)}
                                onClear={() => handleClear(gift.id, "mark")}
                              />
                            </div>
                          </div>

                          {on && row && (
                            <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                              {CARD_DESIGNS.map((d) => (
                                <button
                                  key={d.value}
                                  type="button"
                                  onClick={() => setDesign(gift.id, d.value)}
                                  aria-pressed={row.design === d.value}
                                  className={`rounded-[10px] border px-3 py-1.5 text-left transition ${
                                    row.design === d.value
                                      ? "border-rose bg-rose/10 text-foreground"
                                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span className="block text-xs font-medium">{d.label}</span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    {d.blurb}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* ─── the running order ─── */}
              {rows.length > 1 && (
                <section className="mt-10">
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                    Order on the sheet — drag to rearrange
                  </p>
                  <ul className="space-y-1.5">
                    {cards.map(({ row, gift, number }, i) => (
                      <li
                        key={row.id}
                        draggable
                        onDragStart={() => (dragFrom.current = i)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(i);
                        }}
                        onDragLeave={() => setDragOver((v) => (v === i ? null : v))}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragFrom.current !== null) move(dragFrom.current, i);
                          dragFrom.current = null;
                          setDragOver(null);
                        }}
                        onDragEnd={() => {
                          dragFrom.current = null;
                          setDragOver(null);
                        }}
                        className={`flex cursor-grab items-center gap-3 rounded-[10px] border bg-card px-3 py-2 transition active:cursor-grabbing ${
                          dragOver === i ? "border-rose" : "border-border"
                        }`}
                      >
                        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-mono text-[11px] tracking-[0.18em] text-rose">
                          {String(number).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {gift.payload.title}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {CARD_DESIGNS.find((d) => d.value === row.design)?.label}
                        </span>
                        {/* Keyboard equivalent — dragging is an enhancement, never
                            the only way to reorder. */}
                        <span className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => move(i, i - 1)}
                            disabled={i === 0}
                            className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-foreground disabled:opacity-30"
                          >
                            ↑<span className="sr-only">Move earlier</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => move(i, i + 1)}
                            disabled={i === cards.length - 1}
                            className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground transition hover:border-foreground disabled:opacity-30"
                          >
                            ↓<span className="sr-only">Move later</span>
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  disabled={cards.length === 0}
                  className="inline-flex items-center gap-2 rounded-full bg-rose px-6 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Printer className="h-4 w-4" />
                  Print {sheets.length || 0} sheet{sheets.length === 1 ? "" : "s"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Set the printer to <b className="font-medium text-foreground">A4 landscape</b> and
                  scale to 100%. “Save as PDF” gives you the same sheets as a file.
                </p>
              </div>
            </div>

            <PreviewPanel
              gift={focusGift}
              design={focusDesign}
              number={focusNumber || 1}
              onSheet={!!focusGift && selected.has(focusGift.id)}
            />
          </div>
        </div>
      </div>

      <SheetPreview sheets={sheets} />
    </ProtectedRoute>
  );
};

/**
 * The card being shaped, pinned beside the bench.
 *
 * Same `GiftPrintCard` the sheet uses — not a stand-in — so what is on screen
 * here is what lands on the paper. Ticking a gift, switching a design or
 * dropping in a photo all point this at that gift.
 */
const PreviewPanel = ({
  gift,
  design,
  number,
  onSheet,
}: {
  gift: MysteryGift | null;
  design: CardDesign;
  number: number;
  onSheet: boolean;
}) => (
  <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-24">
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        Preview
      </p>
      {gift && (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose">
          {CARD_DESIGNS.find((d) => d.value === design)?.label}
        </p>
      )}
    </div>

    {gift ? (
      <>
        <div className="rounded-[14px] border border-border bg-card p-3 shadow-romantic">
          <GiftPrintCard
            key={`${gift.id}-${design}`}
            gift={gift}
            design={design}
            number={number}
          />
        </div>
        {!onSheet && (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
            Not on the sheet yet — tick it to include it.
          </p>
        )}
      </>
    ) : (
      <div className="flex aspect-[148/105] flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-border p-6 text-center">
        <Printer className="h-4 w-4 text-muted-foreground" />
        <p className="text-[11px] leading-snug text-muted-foreground">
          Tick a gift and its card turns up here, exactly as it prints.
        </p>
      </div>
    )}
  </aside>
);

/** One image slot's control: upload, replace, or remove. */
const ImageSlotButton = ({
  label,
  url,
  busy,
  onPick,
  onClear,
}: {
  label: string;
  url: string | null;
  busy: boolean;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) => {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-[10px] border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-foreground hover:text-foreground disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : url ? (
          <img src={url} alt="" className="h-5 w-5 rounded object-cover" />
        ) : (
          <ImagePlus className="h-3.5 w-3.5" />
        )}
        {label}
      </button>

      {url && !busy && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-[10px] border border-border p-1.5 text-muted-foreground transition hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Remove the {label.toLowerCase()}</span>
        </button>
      )}

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          /* Same file twice in a row has to fire change again. */
          e.target.value = "";
        }}
      />
    </div>
  );
};

/**
 * The sheets themselves, portalled to `document.body`.
 *
 * On screen they read as the continuation of the bench above; on paper they
 * are the only thing left (see the `@media print` block in index.css).
 */
const SheetPreview = ({
  sheets,
}: {
  sheets: { row: Row; gift: MysteryGift; number: number }[][];
}) => {
  if (typeof document === "undefined" || sheets.length === 0) return null;

  return createPortal(
    <div className="print-root bg-background px-4 pb-24 sm:px-8">
      <div className="print-stack mx-auto max-w-5xl">
        <p className="print-chrome mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
          What comes out of the printer
        </p>

        <div className="print-stack space-y-8">
          {sheets.map((sheet, s) => (
            <div key={s} className="print-sheet">
              {sheet.map(({ row, gift, number }) => (
                <div key={row.id} className="print-cell">
                  <GiftPrintCard gift={gift} design={row.design} number={number} />
                </div>
              ))}
              {/* Keep the grid square on a part-full last sheet, so three
                  cards still cut on the same marks as four. */}
              {Array.from({ length: PER_SHEET - sheet.length }).map((_, i) => (
                <div key={`blank-${i}`} className="print-cell" aria-hidden="true" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PrintGiftsPage;
