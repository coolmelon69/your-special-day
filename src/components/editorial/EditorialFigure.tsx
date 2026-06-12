import { cn } from "@/lib/utils";

interface EditorialFigureProps {
  src: string;
  alt: string;
  /** Floating mono annotation box, top-right of the image. */
  annotate?: React.ReactNode;
  /** Mono caption rule below the image. */
  caption?: React.ReactNode;
  /** Decorative dotted-grid corner. */
  dotGrid?: "tl" | "br" | false;
  /** Tailwind aspect class, e.g. "aspect-square". */
  aspectClassName?: string;
  className?: string;
  /** Overlay content (e.g. a floating keepsake card) positioned by the caller. */
  children?: React.ReactNode;
}

const dotGridPos: Record<"tl" | "br", string> = {
  tl: "-top-5 -left-5",
  br: "-bottom-5 -right-5",
};

/** Editorial figure: image + optional annotation, dotgrid, caption, and overlay. */
const EditorialFigure = ({
  src,
  alt,
  annotate,
  caption,
  dotGrid = false,
  aspectClassName,
  className,
  children,
}: EditorialFigureProps) => (
  <div className={cn("relative", className)}>
    {dotGrid && <span className={cn("dotgrid", dotGridPos[dotGrid])} />}
    <img
      src={src}
      alt={alt}
      className={cn("w-full rounded-2xl border border-border object-cover", aspectClassName)}
    />
    {annotate && <div className="annotate">{annotate}</div>}
    {caption && <div className="figure-cap">{caption}</div>}
    {children}
  </div>
);

export default EditorialFigure;
