import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Save,
  RotateCcw,
  Check,
  Sparkles,
  Hash,
  Clock,
  MapPin,
  Trophy,
  Camera,
  Receipt as ReceiptIcon,
  Eye,
  Braces,
} from "lucide-react";
import type { WrappedTemplateCopy, WrappedHeadingTemplate } from "@/types/admin";
import { WRAPPED_TEMPLATE_DEFAULTS } from "@/components/wrapped/copy";
import { applyHeadingTokens, applyTokens } from "@/utils/wrappedTemplate";
import { getWrappedTemplateCopy, updateWrappedTemplateCopy } from "@/utils/adminStorage";

type SlideKey = keyof Omit<WrappedTemplateCopy, "updatedAt">;
type Path = string[];

/* ── immutable get/set over the copy tree ───────────────────────────── */

const get = (obj: unknown, path: Path): string =>
  path.reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj) as string;

const set = <T,>(obj: T, path: Path, value: unknown): T => {
  const [head, ...rest] = path;
  const branch = (obj as Record<string, unknown>)[head];
  return {
    ...obj,
    [head]: rest.length ? set(branch as object, rest, value) : value,
  };
};

/* ── field + slide specs ────────────────────────────────────────────── */

type FieldSpec = { label: string; path: Path; wide?: boolean };

type SlideSpec = {
  key: SlideKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** hue for this slide, as raw HSL channels fed to `--tone` */
  tone: string;
  /** shown in the preview strip */
  blurb: string;
  eyebrow?: Path;
  heading?: Path;
  fields: FieldSpec[];
  /** sample values for `{token}` placeholders, so the preview reads real */
  sample?: Record<string, string>;
};

const SLIDES: SlideSpec[] = [
  {
    key: "intro",
    label: "Intro",
    icon: Sparkles,
    tone: "272 52% 48%",
    blurb: "The opening card — first thing they see.",
    eyebrow: ["intro", "eyebrow"],
    heading: ["intro", "heading"],
    fields: [
      { label: "Hint", path: ["intro", "hint"], wide: true },
      { label: "Mock hint — shown when nothing was collected", path: ["intro", "mockHint"], wide: true },
    ],
  },
  {
    key: "numbers",
    label: "Numbers",
    icon: Hash,
    tone: "255 48% 50%",
    blurb: "The four headline stats of the day.",
    eyebrow: ["numbers", "eyebrow"],
    heading: ["numbers", "heading"],
    fields: [
      { label: "Stamps label", path: ["numbers", "statLabels", "stamps"] },
      { label: "Photos label", path: ["numbers", "statLabels", "photos"] },
      { label: "Coupons label", path: ["numbers", "statLabels", "coupons"] },
      { label: "Distance label", path: ["numbers", "statLabels", "distance"] },
    ],
  },
  {
    key: "time",
    label: "Time",
    icon: Clock,
    tone: "330 58% 48%",
    blurb: "How long the day ran, end to end.",
    eyebrow: ["time", "eyebrow"],
    heading: ["time", "heading"],
    sample: { duration: "6h 20m", time: "9:41" },
    fields: [
      { label: "First stamp label", path: ["time", "firstStampLabel"] },
      { label: "Last stamp label", path: ["time", "lastStampLabel"] },
      { label: "Longest gap label", path: ["time", "longestGapLabel"], wide: true },
    ],
  },
  {
    key: "route",
    label: "Route",
    icon: MapPin,
    tone: "205 60% 42%",
    blurb: "Distance walked and checkpoints hit.",
    eyebrow: ["route", "eyebrow"],
    heading: ["route", "heading"],
    sample: { distance: "4.2" },
    fields: [{ label: "Checkpoints label", path: ["route", "checkpointsLabel"], wide: true }],
  },
  {
    key: "topMoment",
    label: "Top Moment",
    icon: Trophy,
    tone: "300 40% 46%",
    blurb: "The checkpoint they photographed most.",
    eyebrow: ["topMoment", "eyebrow"],
    heading: ["topMoment", "heading"],
    sample: { title: "Sunset Point", count: "12" },
    fields: [
      { label: "Photos label", path: ["topMoment", "photosLabel"] },
      { label: "Caption", path: ["topMoment", "caption"] },
    ],
  },
  {
    key: "photoStats",
    label: "Photo Stats",
    icon: Camera,
    tone: "172 55% 32%",
    blurb: "Camera roll tally and favourite filter.",
    eyebrow: ["photoStats", "eyebrow"],
    heading: ["photoStats", "heading"],
    sample: { filter: "Warm" },
    fields: [
      { label: "Photos label", path: ["photoStats", "photosLabel"] },
      { label: "Stickers label", path: ["photoStats", "stickersLabel"] },
      { label: "Filter label", path: ["photoStats", "filterLabel"], wide: true },
    ],
  },
  {
    key: "receipt",
    label: "Receipt",
    icon: ReceiptIcon,
    tone: "28 70% 40%",
    blurb: "The itemized receipt that closes the story.",
    fields: [
      { label: "Title", path: ["receipt", "title"] },
      { label: "Subtitle", path: ["receipt", "subtitle"] },
      { label: "Photos label", path: ["receipt", "photosLabel"] },
      { label: "Stickers label", path: ["receipt", "stickersLabel"] },
      { label: "Distance label", path: ["receipt", "distanceLabel"] },
      { label: "Time out label", path: ["receipt", "timeOutLabel"] },
      { label: "Total label", path: ["receipt", "totalLabel"] },
      { label: "Total value", path: ["receipt", "totalValue"] },
      { label: "Footer", path: ["receipt", "footer"], wide: true },
    ],
  },
];

/** Every editable path on a slide, heading parts included. */
const pathsOf = (slide: SlideSpec): Path[] => [
  ...(slide.eyebrow ? [slide.eyebrow] : []),
  ...(slide.heading ? ["before", "emphasis", "after"].map((p) => [...slide.heading!, p]) : []),
  ...slide.fields.map((f) => f.path),
];

const countEdited = (copy: WrappedTemplateCopy, slide: SlideSpec): number =>
  pathsOf(slide).filter((p) => get(copy, p) !== get(WRAPPED_TEMPLATE_DEFAULTS, p)).length;

/* ── field ──────────────────────────────────────────────────────────── */

const TOKEN_RE = /\{[a-zA-Z]+\}/g;

const Field = ({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: string;
  defaultValue: string;
  onChange: (value: string) => void;
}) => {
  const edited = value !== defaultValue;
  const tokens = defaultValue.match(TOKEN_RE) ?? [];

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {edited && (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.08em] text-[hsl(var(--tone))]">
            <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--tone))]" />
            edited
          </span>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultValue}
        className={`w-full px-3 py-2 text-sm rounded-[10px] bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--tone)/0.2)] focus:border-[hsl(var(--tone))] transition-colors border ${
          edited ? "border-[hsl(var(--tone)/0.45)]" : "border-border"
        }`}
      />
      {tokens.length > 0 && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Braces className="w-3 h-3 text-[hsl(var(--tone))]" />
          Keep {tokens.join(" ")} to show the live value.
        </p>
      )}
    </div>
  );
};

/* ── editor ─────────────────────────────────────────────────────────── */

const WrappedTemplateEditor = () => {
  const [copy, setCopy] = useState<WrappedTemplateCopy | null>(null);
  const [activeKey, setActiveKey] = useState<SlideKey>("intro");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setCopy(await getWrappedTemplateCopy());
    } catch (error) {
      console.error("Error loading wrapped template copy:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const slide = SLIDES.find((s) => s.key === activeKey)!;

  const editedCounts = useMemo(() => {
    if (!copy) return {} as Record<SlideKey, number>;
    return Object.fromEntries(SLIDES.map((s) => [s.key, countEdited(copy, s)])) as Record<SlideKey, number>;
  }, [copy]);

  const totalEdited = Object.values(editedCounts).reduce((a, b) => a + b, 0);

  const handleSave = async () => {
    if (!copy) return;
    try {
      setIsSaving(true);
      await updateWrappedTemplateCopy(copy);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      console.error("Error saving wrapped template copy:", error);
      alert("Failed to save template copy. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAll = () => {
    if (!window.confirm("Reset all built-in slide copy to defaults?")) return;
    setCopy(WRAPPED_TEMPLATE_DEFAULTS);
  };

  const handleResetSlide = () => {
    if (!copy) return;
    setCopy({ ...copy, [slide.key]: WRAPPED_TEMPLATE_DEFAULTS[slide.key] });
  };

  if (isLoading || !copy) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const setPath = (path: Path, value: string) => setCopy(set(copy, path, value));

  const heading: WrappedHeadingTemplate | null = slide.heading
    ? (get(copy, slide.heading) as unknown as WrappedHeadingTemplate)
    : null;
  const previewHeading = heading ? applyHeadingTokens(heading, slide.sample ?? {}) : null;
  const previewEyebrow = slide.eyebrow ? applyTokens(get(copy, slide.eyebrow), slide.sample ?? {}) : null;

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="font-serif text-2xl font-bold text-foreground">Slide copy</h2>
        <div className="flex items-center gap-3">
          {totalEdited > 0 && (
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              {totalEdited} field{totalEdited === 1 ? "" : "s"} customised
            </span>
          )}
          <button
            onClick={handleResetAll}
            className="px-3 py-1.5 text-xs font-medium rounded-[10px] border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset all
          </button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Wording for the built-in /wrapped slides. Leave a field blank to fall back to the default.
      </p>

      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        {/* slide rail */}
        <nav
          aria-label="Slides"
          className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible -mx-1 px-1 pb-1 lg:pb-0"
        >
          {SLIDES.map(({ key, label, icon: Icon, tone }) => {
            const isActive = key === activeKey;
            const n = editedCounts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                style={{ "--tone": tone } as React.CSSProperties}
                aria-current={isActive ? "true" : undefined}
                className={`shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-colors border text-left ${
                  isActive
                    ? "bg-[hsl(var(--tone)/0.1)] border-[hsl(var(--tone)/0.35)] text-[hsl(var(--tone))]"
                    : "bg-transparent border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "" : "text-muted-foreground"}`} />
                <span className="whitespace-nowrap">{label}</span>
                {n > 0 && (
                  <span
                    className={`ml-auto shrink-0 min-w-5 px-1.5 h-5 rounded-full font-mono text-[10px] leading-5 text-center ${
                      isActive
                        ? "bg-[hsl(var(--tone)/0.16)] text-[hsl(var(--tone))]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* panel */}
        <AnimatePresence mode="wait">
          <motion.section
            key={slide.key}
            style={{ "--tone": slide.tone } as React.CSSProperties}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-[hsl(var(--tone)/0.28)] overflow-hidden bg-card"
          >
            {/* panel header */}
            <header className="flex items-start justify-between gap-3 px-4 py-3 bg-[hsl(var(--tone)/0.08)] border-b border-[hsl(var(--tone)/0.2)]">
              <div className="flex items-start gap-2.5">
                <slide.icon className="w-4 h-4 mt-0.5 text-[hsl(var(--tone))]" />
                <div>
                  <h3 className="text-sm font-semibold text-[hsl(var(--tone))] leading-tight">{slide.label}</h3>
                  <p className="text-xs text-[hsl(var(--tone)/0.75)] mt-0.5">{slide.blurb}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResetSlide}
                disabled={editedCounts[slide.key] === 0}
                className="shrink-0 text-xs text-[hsl(var(--tone))] hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed flex items-center gap-1"
                title={`Reset ${slide.label} to default`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </header>

            <div className="p-4 space-y-5">
              {/* live preview */}
              <div className="rounded-[12px] border border-dashed border-[hsl(var(--tone)/0.35)] bg-[hsl(var(--tone)/0.04)] px-4 py-4">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(var(--tone)/0.85)] mb-3">
                  <Eye className="w-3 h-3" />
                  Preview
                </p>
                {previewHeading ? (
                  <>
                    {previewEyebrow && (
                      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-primary mb-2">
                        {previewEyebrow}
                      </p>
                    )}
                    <p className="display font-serif font-bold tracking-tight leading-[1.1] text-2xl text-foreground">
                      {previewHeading.before}
                      <em>{previewHeading.emphasis}</em>
                      {previewHeading.after}
                    </p>
                  </>
                ) : (
                  <div className="font-mono text-xs text-foreground max-w-xs">
                    <p className="uppercase tracking-[0.1em] text-center">{copy.receipt.title}</p>
                    <p className="text-center text-muted-foreground mb-2">{copy.receipt.subtitle}</p>
                    <div className="border-t border-dashed border-border pt-2 space-y-1">
                      {[
                        [copy.receipt.photosLabel, "24"],
                        [copy.receipt.stickersLabel, "7"],
                        [copy.receipt.distanceLabel, "4.2 km"],
                        [copy.receipt.timeOutLabel, "6h 20m"],
                      ].map(([label, value]) => (
                        <p key={label} className="flex justify-between gap-4">
                          <span className="text-muted-foreground">{label}</span>
                          <span>{value}</span>
                        </p>
                      ))}
                      <p className="flex justify-between gap-4 border-t border-dashed border-border pt-1 font-medium">
                        <span>{copy.receipt.totalLabel}</span>
                        <span>{copy.receipt.totalValue}</span>
                      </p>
                    </div>
                    <p className="text-center text-muted-foreground mt-2">{copy.receipt.footer}</p>
                  </div>
                )}
              </div>

              {/* eyebrow + heading */}
              {slide.eyebrow && (
                <Field
                  label="Eyebrow"
                  value={get(copy, slide.eyebrow)}
                  defaultValue={get(WRAPPED_TEMPLATE_DEFAULTS, slide.eyebrow)}
                  onChange={(v) => setPath(slide.eyebrow!, v)}
                />
              )}

              {slide.heading && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Heading — the emphasis part renders in rose italic
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["before", "emphasis", "after"] as const).map((part) => (
                      <Field
                        key={part}
                        label={part[0].toUpperCase() + part.slice(1)}
                        value={get(copy, [...slide.heading!, part])}
                        defaultValue={get(WRAPPED_TEMPLATE_DEFAULTS, [...slide.heading!, part])}
                        onChange={(v) => setPath([...slide.heading!, part], v)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* remaining fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slide.fields.map((f) => (
                  <div key={f.path.join(".")} className={f.wide ? "sm:col-span-2" : undefined}>
                    <Field
                      label={f.label}
                      value={get(copy, f.path)}
                      defaultValue={get(WRAPPED_TEMPLATE_DEFAULTS, f.path)}
                      onChange={(v) => setPath(f.path, v)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <motion.button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-5 w-full px-6 py-3 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        whileTap={{ scale: 0.97 }}
      >
        {justSaved ? (
          <>
            <Check className="w-4 h-4" />
            Saved
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {isSaving ? "Saving…" : "Save slide copy"}
          </>
        )}
      </motion.button>
    </div>
  );
};

export default WrappedTemplateEditor;
