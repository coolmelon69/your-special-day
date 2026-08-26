import QRCode from "react-qr-code";
import { ImagePlus } from "lucide-react";
import { formatGiftCode, giftQRValue, type MysteryGift } from "@/utils/mysteryGifts";

/**
 * One printed Mystery Gift card, in one of six designs.
 *
 * A section-local world: everything here is scoped under `.giftcard` in
 * src/index.css and speaks card stock, not the editorial system. The one rule
 * that outranks looks is that the code has to scan — see the quiet-zone notes
 * on each design in the CSS.
 *
 * Sized entirely in `cqw` against the card's own container, so the same
 * component renders at 640px in the screen preview and at 148mm on the sheet
 * with no second set of numbers. The caller sets the width; the aspect ratio
 * is fixed here.
 */

/** The six that survived the mockups. Chosen per card at print time. */
export type CardDesign = "token" | "split" | "roundel" | "airmail" | "reversed" | "deckle";

export const CARD_DESIGNS: { value: CardDesign; label: string; blurb: string }[] = [
  { value: "token", label: "Token", blurb: "Mark punched into the code" },
  { value: "split", label: "Half and half", blurb: "Photo left, clean scan field right" },
  { value: "roundel", label: "Roundel", blurb: "Duotone bleed, circling type" },
  { value: "airmail", label: "Airmail", blurb: "Chevron border, sent from somewhere" },
  { value: "reversed", label: "Reversed front", blurb: "The photo is the card, edge to edge" },
  { value: "deckle", label: "Deckle & tape", blurb: "Torn stock, a polaroid taped on" },
];

/** The wax-seal fallback for an empty Mark slot — a few tints, no logo to ask for. */
export type MarkPreset = "rose" | "ink" | "kraft";

export const MARK_PRESETS: { value: MarkPreset; label: string }[] = [
  { value: "rose", label: "Rose" },
  { value: "ink", label: "Ink" },
  { value: "kraft", label: "Kraft" },
];

const SEAL_TINTS: Record<MarkPreset, { base: string; ring: string; glyph: string }> = {
  rose: { base: "hsl(330 60% 42%)", ring: "hsl(330 70% 88% / .5)", glyph: "hsl(330 78% 93%)" },
  ink: { base: "hsl(30 12% 20%)", ring: "hsl(36 30% 88% / .35)", glyph: "hsl(38 34% 92%)" },
  kraft: { base: "hsl(32 46% 40%)", ring: "hsl(40 40% 90% / .4)", glyph: "hsl(42 46% 93%)" },
};

/** The seal's base colour alone — for the swatch picker on /print/gifts,
 *  which shows the tint without rendering the whole glyph. */
export const MARK_PRESET_COLOR: Record<MarkPreset, string> = {
  rose: SEAL_TINTS.rose.base,
  ink: SEAL_TINTS.ink.base,
  kraft: SEAL_TINTS.kraft.base,
};

type Props = {
  gift: MysteryGift;
  design: CardDesign;
  /** Position in the print run — printed as `Nº 07`, purely so two cards on a
   *  sheet can be told apart by eye while cutting. */
  number: number;
  /** Which wax seal fills the Mark slot when nothing has been uploaded there.
   *  Ignored once the gift has its own mark image. */
  markPreset: MarkPreset;
};

const no = (n: number) => `Nº ${String(n).padStart(2, "0")}`;

/** An image slot: the uploaded photo, a caller-given fallback, or a hatched
 *  stand-in naming what's missing. */
const Slot = ({
  url,
  alt,
  label,
  fallback,
}: {
  url: string | null;
  alt: string;
  label: string;
  fallback?: React.ReactNode;
}) =>
  url ? (
    <img src={url} alt={alt} className="gc-img" />
  ) : fallback ? (
    <>{fallback}</>
  ) : (
    <div className="gc-empty">
      <ImagePlus className="gc-empty-icon" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );

/** A pressed heart rather than a monogram — no initials to ask for, and it
 *  still reads as sealed shut in any of the three tints. */
const WaxSeal = ({ tint }: { tint: MarkPreset }) => {
  const t = SEAL_TINTS[tint];
  return (
    <svg className="gc-seal" viewBox="0 0 100 100" role="img" aria-label="Wax seal">
      <circle cx="50" cy="50" r="47" fill={t.base} />
      <circle cx="50" cy="50" r="37" fill="none" stroke={t.ring} strokeWidth="1.4" />
      <path
        d="M50 66.5c-13-9-19.5-15-19.5-22.4a9.3 9.3 0 0119-3.2A9.3 9.3 0 0169.5 44.1c0 7.4-6.5 13.4-19.5 22.4z"
        fill={t.glyph}
      />
    </svg>
  );
};

/** The postmark struck over the stamp — decorative, and set to the site's
 *  own name rather than anything per-gift. */
const Cancel = ({ className }: { className?: string }) => (
  <div className={`gc-cancel ${className ?? ""}`.trim()} aria-hidden="true">
    <span>
      your
      <br />
      special
      <br />
      day
    </span>
  </div>
);

const GiftPrintCard = ({ gift, design, number, markPreset }: Props) => {
  const value = giftQRValue(gift.code);
  const code = formatGiftCode(gift.code);
  const { title, description } = gift.payload;

  /* The token design punches the mark out of the middle of the code, which
     costs redundancy the reader needs back — level H recovers ~30%, enough to
     survive the hole. The other designs leave the code intact. */
  const level = design === "token" ? "H" : "Q";

  const qr = <QRCode value={value} level={level} size={512} className="gc-qr" />;
  const mark = <Slot url={gift.printMark} alt="" label="mark" fallback={<WaxSeal tint={markPreset} />} />;

  if (design === "token") {
    return (
      <article className="giftcard gc-token">
        <div className="gc-band">
          <Slot url={gift.printHero} alt="" label="photo" />
          <div className="gc-band-scrim" aria-hidden="true" />
        </div>

        <div className="gc-band-text">
          <h3 className="gc-title">{title}</h3>
          <span className="gc-no">{no(number)}</span>
        </div>

        <div className="gc-token-face">
          {qr}
          <div className="gc-knock">{mark}</div>
        </div>

        <div className="gc-token-foot">
          <span className="gc-code">{code}</span>
          <span className="gc-cap">scan it, or type it in</span>
        </div>
      </article>
    );
  }

  if (design === "split") {
    return (
      <article className="giftcard gc-split">
        <div className="gc-split-left">
          <Slot url={gift.printHero} alt="" label="photo" />
          <h3 className="gc-title">{title}</h3>
          <span className="gc-cap gc-split-cap">{no(number)} · sealed</span>
        </div>

        <div className="gc-split-right">
          <div className="gc-split-qr">{qr}</div>
          <p className="gc-code">{code}</p>
          <span className="gc-cap">scan or type</span>
        </div>

        <div className="gc-split-seal">{mark}</div>
      </article>
    );
  }

  if (design === "roundel") {
    return (
      <article className="giftcard gc-roundel">
        <div className="gc-roundel-bg">
          <Slot url={gift.printHero} alt="" label="photo" />
          <div className="gc-duo" aria-hidden="true" />
          <div className="gc-veil" aria-hidden="true" />
        </div>

        <h3 className="gc-title">{title}</h3>
        <span className="gc-no">sealed</span>

        <div className="gc-ring-stack">
          <span className="gc-ring" aria-hidden="true" />
          <span className="gc-ring gc-ring-in" aria-hidden="true" />
          <svg className="gc-ringtext" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <path id={`ring-${gift.id}`} d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" />
            </defs>
            <text>
              <textPath href={`#ring-${gift.id}`} startOffset="0">
                {`scan to open · ${no(number)} · sealed for you · scan to open · ${no(number)} · sealed for you · `}
              </textPath>
            </text>
          </svg>
          <div className="gc-roundel-qr">{qr}</div>
        </div>

        <span className="gc-code">{code}</span>
        {description ? <span className="gc-roundel-desc">{description}</span> : null}

        <div className="gc-roundel-seal">{mark}</div>
      </article>
    );
  }

  if (design === "airmail") {
    return (
      <article className="giftcard gc-airmail">
        <div className="gc-airmail-inner">
          <div className="gc-airmail-photo">
            <Slot url={gift.printHero} alt="" label="photo" />
          </div>
          <div className="gc-airmail-right">
            <span className="gc-airmail-par">par avion</span>
            <h3 className="gc-title">{title}</h3>
            {description ? <p className="gc-airmail-desc">{description}</p> : null}
            <div className="gc-airmail-foot">
              <div>
                <p className="gc-code">{code}</p>
                <span className="gc-cap">{no(number)} · scan or type</span>
              </div>
              <div className="gc-airmail-qrbox">{qr}</div>
            </div>
          </div>
        </div>
        <div className="gc-airmail-edge" aria-hidden="true" />
        <div className="gc-stamp gc-airmail-stamp">
          <div className="gc-stamp-face">{mark}</div>
        </div>
        <Cancel className="gc-airmail-cancel" />
      </article>
    );
  }

  if (design === "reversed") {
    return (
      <article className="giftcard gc-reversed">
        <div className="gc-reversed-photo">
          <Slot url={gift.printHero} alt="" label="photo" />
        </div>
        <div className="gc-reversed-scrim" aria-hidden="true" />
        <div className="gc-reversed-inner">
          <span className="gc-reversed-hand">{no(number)} · sealed, for you</span>
          <h3 className="gc-title">{title}</h3>
          {description ? <p className="gc-reversed-desc">{description}</p> : null}
          <div className="gc-reversed-foot">
            <div>
              <p className="gc-code">{code}</p>
              <span className="gc-cap">scan or type</span>
            </div>
            <div className="gc-reversed-qrchip">{qr}</div>
          </div>
        </div>
        <div className="gc-stamp gc-reversed-stamp">
          <div className="gc-stamp-face">{mark}</div>
        </div>
        <Cancel className="gc-reversed-cancel" />
      </article>
    );
  }

  /* design === "deckle" — the torn edge is a real SVG turbulence
     displacement, chained separately from the drop-shadow rather than
     combined in one `filter` list: see index.css's note on `.gc-deckle-shadow`
     about the roundel's own run-in with Chromium mispainting a filter stack
     in its PDF pass. Three nested layers (shadow → filtered → card) is the
     same caution applied before that bug gets a chance to happen here too —
     which makes `.gc-deckle-shadow`, not `.giftcard`, the sheet's actual
     grid cell child; index.css sizes both. */
  const deckleId = `gc-deckle-filter-${gift.id}`;
  return (
    <div className="gc-deckle-shadow">
      <div className="gc-deckle-outer" style={{ filter: `url(#${deckleId})` }}>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
          <filter id={deckleId} x="-4%" y="-6%" width="108%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.024 0.05" numOctaves={4} seed={7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={7} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
        <article className="giftcard gc-deckle">
          <div className="gc-deckle-inner">
            <div className="gc-deckle-snap">
              <span className="gc-deckle-tape gc-deckle-tape-a" aria-hidden="true" />
              <span className="gc-deckle-tape gc-deckle-tape-b" aria-hidden="true" />
              <Slot url={gift.printHero} alt="" label="photo" />
              <span className="gc-deckle-snap-cap">us, that morning</span>
            </div>
            <div className="gc-deckle-right">
              <p className="gc-deckle-hand">
                for you,
                <br />
                whenever
              </p>
              <h3 className="gc-title">{title}</h3>
              {description ? <p className="gc-deckle-desc">{description}</p> : null}
              <div className="gc-deckle-foot">
                <div className="gc-deckle-qrbox">{qr}</div>
                <div>
                  <p className="gc-code">{code}</p>
                  <span className="gc-cap">{no(number)} · scan or type</span>
                </div>
              </div>
            </div>
          </div>
          <div className="gc-stamp gc-deckle-stamp">
            <div className="gc-stamp-face">{mark}</div>
          </div>
          <Cancel className="gc-deckle-cancel" />
        </article>
      </div>
    </div>
  );
};

export default GiftPrintCard;
