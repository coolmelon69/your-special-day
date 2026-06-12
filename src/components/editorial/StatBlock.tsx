interface StatBlockProps {
  value: React.ReactNode;
  /** Small superscript-style unit, e.g. "/ 6". */
  unit?: string;
  label: string;
}

/** Big serif stat number + muted label. */
const StatBlock = ({ value, unit, label }: StatBlockProps) => (
  <div>
    <div className="stat-num num">
      {value}
      {unit && <span className="text-[0.5em] opacity-70 ml-0.5 text-muted-foreground">{unit}</span>}
    </div>
    <p className="text-sm text-muted-foreground mt-2 max-w-[24ch]">{label}</p>
  </div>
);

export default StatBlock;
