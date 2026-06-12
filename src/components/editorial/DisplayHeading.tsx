import { cn } from "@/lib/utils";

interface DisplayHeadingProps {
  children: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
}

/**
 * Editorial serif display heading. Pass <em> for rose-italic emphasis,
 * <strong> for bold roman, and <span className="dot-accent">.</span> for the
 * accent period. Emphasis colors are handled by the `.display` rules in index.css.
 */
const DisplayHeading = ({ children, as: Tag = "h1", className }: DisplayHeadingProps) => (
  <Tag
    className={cn(
      "display font-serif font-bold tracking-tight leading-[1.02] text-foreground",
      Tag === "h1" ? "text-5xl md:text-6xl lg:text-7xl" : "text-3xl md:text-4xl lg:text-5xl",
      className
    )}
  >
    {children}
  </Tag>
);

export default DisplayHeading;
