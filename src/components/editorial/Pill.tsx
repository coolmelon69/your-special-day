import { cn } from "@/lib/utils";

type PillVariant = "accent" | "rose" | "done" | "tag";

interface PillProps {
  children: React.ReactNode;
  variant?: PillVariant;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<PillVariant, string> = {
  accent: "bg-primary/10 text-primary font-mono text-[11px] tracking-wide uppercase",
  rose: "bg-rose/15 text-rose font-mono text-[11px] tracking-wide uppercase",
  done: "bg-green-500/15 text-green-600 font-mono text-[11px] tracking-wide uppercase",
  tag: "border border-border text-muted-foreground text-xs",
};

/** Editorial pill / tag. `tag` variant is the outlined, normal-case chip. */
const Pill = ({ children, variant = "accent", icon, className }: PillProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap",
      variantClasses[variant],
      className
    )}
  >
    {icon && <span className="[&>svg]:w-3 [&>svg]:h-3">{icon}</span>}
    {children}
  </span>
);

export default Pill;
