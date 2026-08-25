import QRCode from "react-qr-code";
import { ImagePlus } from "lucide-react";
import { formatGiftCode, giftQRValue, type MysteryGift } from "@/utils/mysteryGifts";

/**
 * One printed Mystery Gift card, in one of three designs.
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

/** The three that survived the mockups. Chosen per card at print time. */
export type CardDesign = "token" | "split" | "roundel";

export const CARD_DESIGNS: { value: CardDesign; label: string; blurb: string }[] = [
  { value: "token", label: "Token", blurb: "Mark punched into the code" },
  { value: "split", label: "Half and half", blurb: "Photo left, clean scan field right" },
  { value: "roundel", label: "Roundel", blurb: "Duotone bleed, circling type" },
];

type Props = {
  gift: MysteryGift;
  design: CardDesign;
  /** Position in the print run — printed as `Nº 07`, purely so two cards on a
   *  sheet can be told apart by eye while cutting. */
  number: number;
};

const no = (n: number) => `Nº ${String(n).padStart(2, "0")}`;

/** An image slot: the uploaded photo, or a hatched stand-in naming what's missing. */
const Slot = ({ url, alt, label }: { url: string | null; alt: string; label: string }) =>
  url ? (
    <img src={url} alt={alt} className="gc-img" />
  ) : (
    <div className="gc-empty">
      <ImagePlus className="gc-empty-icon" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );

const GiftPrintCard = ({ gift, design, number }: Props) => {
  const value = giftQRValue(gift.code);
  const code = formatGiftCode(gift.code);
  const { title, description } = gift.payload;

  /* The token design punches the mark out of the middle of the code, which
     costs redundancy the reader needs back — level H recovers ~30%, enough to
     survive the hole. The other two leave the code intact. */
  const level = design === "token" ? "H" : "Q";

  const qr = <QRCode value={value} level={level} size={512} className="gc-qr" />;

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
          <div className="gc-knock">
            <Slot url={gift.printMark} alt="" label="mark" />
          </div>
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

        <div className="gc-split-seal">
          <Slot url={gift.printMark} alt="" label="mark" />
        </div>
      </article>
    );
  }

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

      <div className="gc-roundel-seal">
        <Slot url={gift.printMark} alt="" label="mark" />
      </div>
    </article>
  );
};

export default GiftPrintCard;
