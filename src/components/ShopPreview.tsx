/**
 * Cosmetic preview swatches — what the shop card shows instead of a generic icon.
 *
 * Each swatch is a cheap CSS restatement of the real effect, not the real
 * component: TrainerCard's holo runs pointer-tracked motion values and a stack
 * of blend layers, which is far too much machinery to mount ten times in a
 * grid. The sticker packs are the exception — those *are* the real pixel-art
 * components, since they're already plain SVG and cost nothing.
 */
import { stickerComponents, type StickerType } from "@/components/StickerPicker";
import { cn } from "@/lib/utils";

/** Which stickers each pack ships. Mirrors `stickerPacks` in StickerPicker —
 *  kept local because that list isn't exported and the shop only needs the
 *  four glyphs per pack, not the pack's own naming. */
const PACK_STICKERS: Record<string, StickerType[]> = {
  "sticker.pack.snacks": ["boba", "ramen", "cake", "ice-cream"],
  "sticker.pack.cats": ["cat-happy", "cat-sleepy", "cat-curious", "cat-loaf"],
  "sticker.pack.celestial": ["moon", "comet", "constellation", "planet"],
};

/** A stand-in photo for the filter swatches — a sunset-ish scene in pure CSS,
 *  so the filters have something with a horizon and a sky to act on. */
const SamplePhoto = ({ className }: { className?: string }) => (
  <div
    className={cn("absolute inset-0", className)}
    style={{
      backgroundImage: [
        "radial-gradient(circle at 72% 30%, hsl(38 90% 72%) 0%, transparent 34%)",
        "linear-gradient(hsl(268 45% 70%) 0%, hsl(330 55% 78%) 46%, hsl(24 60% 68%) 62%, hsl(268 30% 42%) 63%, hsl(268 35% 34%) 100%)",
      ].join(","),
    }}
  />
);

const Frame = ({
  children,
  className,
  style,
}: {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    aria-hidden
    className={cn("relative h-full w-full overflow-hidden rounded-xl", className)}
    style={style}
  >
    {children}
  </div>
);

/** Miniature of the trainer card itself — portrait window, name band, so the
 *  finish and frame swatches read as "this happens to your card". */
const MiniCard = ({
  children,
  bandLabel,
  subtitle,
}: {
  children?: React.ReactNode;
  bandLabel?: string;
  subtitle?: string;
}) => (
  <div className="absolute inset-0 grid place-items-center p-3">
    <div className="relative h-full w-[58%] overflow-hidden rounded-md border border-white/70 bg-white/85 shadow-[0_3px_8px_-4px_hsl(var(--lilac))]">
      {children}
      <div className="absolute inset-x-0 bottom-0 bg-white/90 px-1.5 py-1 backdrop-blur-[1px]">
        <div className="h-1 w-3/4 rounded-full bg-foreground/25" />
        {subtitle ? (
          <p className="mt-0.5 truncate font-serif text-[6px] italic leading-none text-rose">
            {subtitle}
          </p>
        ) : (
          <div className="mt-0.5 h-0.5 w-1/2 rounded-full bg-foreground/10" />
        )}
      </div>
      {bandLabel && (
        <span className="absolute left-1 top-1 rounded-[3px] bg-foreground/70 px-1 font-mono text-[5px] uppercase tracking-wide text-background">
          {bandLabel}
        </span>
      )}
    </div>
  </div>
);

/** Deterministic star field — a fixed list, not `Math.random`, so a re-render
 *  doesn't reshuffle the sky mid-hover. */
const STARS = [
  [14, 22], [31, 68], [48, 16], [63, 47], [79, 31],
  [22, 51], [88, 62], [41, 82], [70, 76], [56, 27],
] as const;

const CosmeticPreview = ({ skuId }: { skuId: string }) => {
  const stickers = PACK_STICKERS[skuId];
  if (stickers) {
    return (
      <Frame className="bg-lilac-light">
        <div className="absolute inset-0 grid grid-cols-2 place-items-center gap-1 p-2">
          {stickers.map((type) => {
            const Sticker = stickerComponents[type];
            return <Sticker key={type} size={26} />;
          })}
        </div>
      </Frame>
    );
  }

  switch (skuId) {
    // Rainbow spectrum sweeping the art window — the holo layer's signature.
    case "card.material.holo":
      return (
        <Frame className="bg-accent">
          <MiniCard>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(115deg, hsl(340 90% 78%), hsl(45 95% 76%), hsl(150 70% 74%), hsl(200 85% 76%), hsl(280 80% 80%), hsl(340 90% 78%))",
                backgroundSize: "220% 220%",
              }}
            />
            <div
              className="absolute inset-0 mix-blend-overlay"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(115deg, rgba(255,255,255,.55) 0 2px, transparent 2px 7px)",
              }}
            />
          </MiniCard>
        </Frame>
      );

    // Brushed metal: fine diagonal stripes, no colour of its own.
    case "card.material.foil":
      return (
        <Frame className="bg-muted">
          <MiniCard>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: [
                  "linear-gradient(135deg, hsl(270 12% 88%), hsl(270 6% 66%) 42%, hsl(0 0% 99%) 52%, hsl(270 10% 72%) 64%, hsl(270 12% 86%))",
                  "repeating-linear-gradient(135deg, rgba(255,255,255,.5) 0 1px, transparent 1px 4px)",
                ].join(","),
              }}
            />
          </MiniCard>
        </Frame>
      );

    // Petals riding the rim only — the art window stays clean, same as the card.
    case "card.frame.sakura":
      return (
        <Frame className="bg-rose-light">
          <MiniCard>
            <div className="absolute inset-0 bg-gradient-to-b from-rose-light to-white" />
            <div className="absolute inset-0 rounded-md border-2 border-rose/45" />
            {[
              [4, 12], [86, 26], [10, 62], [78, 74], [46, 4],
            ].map(([x, y], i) => (
              <span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-[60%_10%_60%_10%] bg-rose/70"
                style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${i * 37}deg)` }}
              />
            ))}
          </MiniCard>
        </Frame>
      );

    // Stars behind the portrait, never in front of it.
    case "card.frame.starfield":
      return (
        <Frame style={{ background: "hsl(268 40% 22%)" }}>
          <MiniCard>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at 30% 20%, hsl(268 55% 42%) 0%, hsl(268 45% 18%) 70%)",
              }}
            />
            {STARS.map(([x, y], i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  height: i % 3 === 0 ? 2 : 1,
                  width: i % 3 === 0 ? 2 : 1,
                  opacity: i % 2 ? 0.7 : 1,
                }}
              />
            ))}
          </MiniCard>
        </Frame>
      );

    // The only cosmetic whose payload is text, so the swatch shows the line.
    case "card.title":
      return (
        <Frame className="bg-accent">
          <MiniCard subtitle="Cake Enthusiast">
            <div className="absolute inset-0 bg-gradient-to-br from-lilac-light to-rose-light" />
          </MiniCard>
        </Frame>
      );

    // White stock, wide bottom margin, soft bloom over the window.
    case "filter.polaroid":
      return (
        <Frame className="bg-muted">
          <div className="absolute inset-0 grid place-items-center p-2.5">
            <div className="relative h-full w-[62%] bg-white p-1 pb-4 shadow-[0_3px_8px_-4px_hsl(var(--lilac))]">
              <div className="relative h-full w-full overflow-hidden">
                <SamplePhoto />
                <div className="absolute inset-0 bg-white/25 mix-blend-soft-light" />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 50% 40%, rgba(255,255,255,.55) 0%, transparent 62%)",
                  }}
                />
              </div>
            </div>
          </div>
        </Frame>
      );

    // Grain, hard flash falloff at the edges, orange date stamp.
    case "filter.disposable":
      return (
        <Frame className="bg-muted">
          <div className="absolute inset-0 grid place-items-center p-2.5">
            <div className="relative h-full w-[68%] overflow-hidden border-2 border-foreground/15">
              <SamplePhoto className="saturate-150 contrast-125" />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 45%, transparent 34%, rgba(0,0,0,.55) 100%)",
                }}
              />
              <div
                className="absolute inset-0 opacity-40 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "repeating-conic-gradient(rgba(255,255,255,.7) 0% 25%, rgba(0,0,0,.7) 0% 50%)",
                  backgroundSize: "3px 3px",
                }}
              />
              <span className="absolute bottom-0.5 right-1 font-mono text-[6px] tracking-tight text-orange-400 [text-shadow:0_0_3px_rgb(251_146_60)]">
                08 08 '26
              </span>
            </div>
          </div>
        </Frame>
      );

    default:
      return <Frame className="bg-muted" />;
  }
};

export default CosmeticPreview;
