import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: React.ReactNode;
  /** Optional issue-style suffix, e.g. "Nº 01" — rendered muted after a · */
  no?: string;
  className?: string;
}

/** Editorial eyebrow: em-dash rule + uppercase mono label + optional Nº suffix. */
const Eyebrow = ({ children, no, className }: EyebrowProps) => (
  <p className={cn("eyebrow", className)}>
    {children}
    {no && (
      <span className="no">
        {"· "}
        {no}
      </span>
    )}
  </p>
);

export default Eyebrow;
