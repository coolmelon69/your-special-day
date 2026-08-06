import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import type { WrappedTemplateCopy, WrappedHeadingTemplate } from "@/types/admin";
import { WRAPPED_TEMPLATE_DEFAULTS } from "@/components/wrapped/copy";
import { getWrappedTemplateCopy, updateWrappedTemplateCopy } from "@/utils/adminStorage";

const inputCls =
  "w-full px-3 py-2 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

type SlideKey = keyof Omit<WrappedTemplateCopy, "updatedAt">;

const SECTIONS: { key: SlideKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "intro", label: "Intro", icon: Sparkles },
  { key: "numbers", label: "Numbers", icon: Hash },
  { key: "time", label: "Time", icon: Clock },
  { key: "route", label: "Route", icon: MapPin },
  { key: "topMoment", label: "Top Moment", icon: Trophy },
  { key: "photoStats", label: "Photo Stats", icon: Camera },
  { key: "receipt", label: "Receipt", icon: ReceiptIcon },
];

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
      />
    </div>
  );
}

function HeadingFields({
  value,
  defaultValue,
  onChange,
}: {
  value: WrappedHeadingTemplate;
  defaultValue: WrappedHeadingTemplate;
  onChange: (value: WrappedHeadingTemplate) => void;
}) {
  const hasToken = /\{[a-zA-Z]+\}/.test(defaultValue.emphasis);
  const token = defaultValue.emphasis.match(/\{[a-zA-Z]+\}/)?.[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Field
        label="Before"
        value={value.before}
        onChange={(v) => onChange({ ...value, before: v })}
        placeholder={defaultValue.before}
      />
      <div>
        <Field
          label="Emphasis"
          value={value.emphasis}
          onChange={(v) => onChange({ ...value, emphasis: v })}
          placeholder={defaultValue.emphasis}
        />
        {hasToken && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Keep {token} in the text to show the live value.
          </p>
        )}
      </div>
      <Field
        label="After"
        value={value.after}
        onChange={(v) => onChange({ ...value, after: v })}
        placeholder={defaultValue.after}
      />
    </div>
  );
}

const WrappedTemplateEditor = () => {
  const [copy, setCopy] = useState<WrappedTemplateCopy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getWrappedTemplateCopy();
      setCopy(data);
    } catch (error) {
      console.error("Error loading wrapped template copy:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleResetSection = (key: SlideKey) => {
    if (!copy) return;
    setCopy({ ...copy, [key]: WRAPPED_TEMPLATE_DEFAULTS[key] });
  };

  if (isLoading || !copy) {
    return (
      <div className="text-center py-8">
        <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-2xl font-bold text-foreground">Slide copy</h2>
        <button
          onClick={handleResetAll}
          className="px-3 py-1.5 text-xs font-medium rounded-[10px] border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset all
        </button>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Edit the wording for the built-in /wrapped slides. Leave a field blank to fall back to the default.
      </p>

      <div className="space-y-3 mb-6">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <details key={key} className="bg-card border border-border rounded-2xl overflow-hidden group" open>
            <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3 list-none">
              <span className="flex items-center gap-2 font-medium text-sm text-foreground">
                <Icon className="w-4 h-4 text-muted-foreground" />
                {label}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleResetSection(key);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title={`Reset ${label} to default`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </summary>

            <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
              {key === "intro" && (
                <>
                  <Field
                    label="Eyebrow"
                    value={copy.intro.eyebrow}
                    onChange={(v) => setCopy({ ...copy, intro: { ...copy.intro, eyebrow: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.intro.eyebrow}
                  />
                  <HeadingFields
                    value={copy.intro.heading}
                    defaultValue={WRAPPED_TEMPLATE_DEFAULTS.intro.heading}
                    onChange={(v) => setCopy({ ...copy, intro: { ...copy.intro, heading: v } })}
                  />
                  <Field
                    label="Hint"
                    value={copy.intro.hint}
                    onChange={(v) => setCopy({ ...copy, intro: { ...copy.intro, hint: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.intro.hint}
                  />
                  <Field
                    label="Mock hint (shown when nothing collected)"
                    value={copy.intro.mockHint}
                    onChange={(v) => setCopy({ ...copy, intro: { ...copy.intro, mockHint: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.intro.mockHint}
                  />
                </>
              )}

              {key === "numbers" && (
                <>
                  <Field
                    label="Eyebrow"
                    value={copy.numbers.eyebrow}
                    onChange={(v) => setCopy({ ...copy, numbers: { ...copy.numbers, eyebrow: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.numbers.eyebrow}
                  />
                  <HeadingFields
                    value={copy.numbers.heading}
                    defaultValue={WRAPPED_TEMPLATE_DEFAULTS.numbers.heading}
                    onChange={(v) => setCopy({ ...copy, numbers: { ...copy.numbers, heading: v } })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Stamps label"
                      value={copy.numbers.statLabels.stamps}
                      onChange={(v) =>
                        setCopy({
                          ...copy,
                          numbers: { ...copy.numbers, statLabels: { ...copy.numbers.statLabels, stamps: v } },
                        })
                      }
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.numbers.statLabels.stamps}
                    />
                    <Field
                      label="Photos label"
                      value={copy.numbers.statLabels.photos}
                      onChange={(v) =>
                        setCopy({
                          ...copy,
                          numbers: { ...copy.numbers, statLabels: { ...copy.numbers.statLabels, photos: v } },
                        })
                      }
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.numbers.statLabels.photos}
                    />
                    <Field
                      label="Coupons label"
                      value={copy.numbers.statLabels.coupons}
                      onChange={(v) =>
                        setCopy({
                          ...copy,
                          numbers: { ...copy.numbers, statLabels: { ...copy.numbers.statLabels, coupons: v } },
                        })
                      }
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.numbers.statLabels.coupons}
                    />
                    <Field
                      label="Distance label"
                      value={copy.numbers.statLabels.distance}
                      onChange={(v) =>
                        setCopy({
                          ...copy,
                          numbers: { ...copy.numbers, statLabels: { ...copy.numbers.statLabels, distance: v } },
                        })
                      }
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.numbers.statLabels.distance}
                    />
                  </div>
                </>
              )}

              {key === "time" && (
                <>
                  <Field
                    label="Eyebrow"
                    value={copy.time.eyebrow}
                    onChange={(v) => setCopy({ ...copy, time: { ...copy.time, eyebrow: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.time.eyebrow}
                  />
                  <HeadingFields
                    value={copy.time.heading}
                    defaultValue={WRAPPED_TEMPLATE_DEFAULTS.time.heading}
                    onChange={(v) => setCopy({ ...copy, time: { ...copy.time, heading: v } })}
                  />
                  <Field
                    label="First stamp label"
                    value={copy.time.firstStampLabel}
                    onChange={(v) => setCopy({ ...copy, time: { ...copy.time, firstStampLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.time.firstStampLabel}
                  />
                  <Field
                    label="Last stamp label"
                    value={copy.time.lastStampLabel}
                    onChange={(v) => setCopy({ ...copy, time: { ...copy.time, lastStampLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.time.lastStampLabel}
                  />
                  <Field
                    label="Longest gap label"
                    value={copy.time.longestGapLabel}
                    onChange={(v) => setCopy({ ...copy, time: { ...copy.time, longestGapLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.time.longestGapLabel}
                  />
                </>
              )}

              {key === "route" && (
                <>
                  <Field
                    label="Eyebrow"
                    value={copy.route.eyebrow}
                    onChange={(v) => setCopy({ ...copy, route: { ...copy.route, eyebrow: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.route.eyebrow}
                  />
                  <HeadingFields
                    value={copy.route.heading}
                    defaultValue={WRAPPED_TEMPLATE_DEFAULTS.route.heading}
                    onChange={(v) => setCopy({ ...copy, route: { ...copy.route, heading: v } })}
                  />
                  <Field
                    label="Checkpoints label"
                    value={copy.route.checkpointsLabel}
                    onChange={(v) => setCopy({ ...copy, route: { ...copy.route, checkpointsLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.route.checkpointsLabel}
                  />
                </>
              )}

              {key === "topMoment" && (
                <>
                  <Field
                    label="Eyebrow"
                    value={copy.topMoment.eyebrow}
                    onChange={(v) => setCopy({ ...copy, topMoment: { ...copy.topMoment, eyebrow: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.topMoment.eyebrow}
                  />
                  <HeadingFields
                    value={copy.topMoment.heading}
                    defaultValue={WRAPPED_TEMPLATE_DEFAULTS.topMoment.heading}
                    onChange={(v) => setCopy({ ...copy, topMoment: { ...copy.topMoment, heading: v } })}
                  />
                  <Field
                    label="Photos label"
                    value={copy.topMoment.photosLabel}
                    onChange={(v) => setCopy({ ...copy, topMoment: { ...copy.topMoment, photosLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.topMoment.photosLabel}
                  />
                  <Field
                    label="Caption"
                    value={copy.topMoment.caption}
                    onChange={(v) => setCopy({ ...copy, topMoment: { ...copy.topMoment, caption: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.topMoment.caption}
                  />
                </>
              )}

              {key === "photoStats" && (
                <>
                  <Field
                    label="Eyebrow"
                    value={copy.photoStats.eyebrow}
                    onChange={(v) => setCopy({ ...copy, photoStats: { ...copy.photoStats, eyebrow: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.photoStats.eyebrow}
                  />
                  <HeadingFields
                    value={copy.photoStats.heading}
                    defaultValue={WRAPPED_TEMPLATE_DEFAULTS.photoStats.heading}
                    onChange={(v) => setCopy({ ...copy, photoStats: { ...copy.photoStats, heading: v } })}
                  />
                  <Field
                    label="Photos label"
                    value={copy.photoStats.photosLabel}
                    onChange={(v) => setCopy({ ...copy, photoStats: { ...copy.photoStats, photosLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.photoStats.photosLabel}
                  />
                  <Field
                    label="Stickers label"
                    value={copy.photoStats.stickersLabel}
                    onChange={(v) => setCopy({ ...copy, photoStats: { ...copy.photoStats, stickersLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.photoStats.stickersLabel}
                  />
                  <Field
                    label="Filter label"
                    value={copy.photoStats.filterLabel}
                    onChange={(v) => setCopy({ ...copy, photoStats: { ...copy.photoStats, filterLabel: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.photoStats.filterLabel}
                  />
                </>
              )}

              {key === "receipt" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field
                      label="Title"
                      value={copy.receipt.title}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, title: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.title}
                    />
                    <Field
                      label="Subtitle"
                      value={copy.receipt.subtitle}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, subtitle: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.subtitle}
                    />
                    <Field
                      label="Photos label"
                      value={copy.receipt.photosLabel}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, photosLabel: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.photosLabel}
                    />
                    <Field
                      label="Stickers label"
                      value={copy.receipt.stickersLabel}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, stickersLabel: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.stickersLabel}
                    />
                    <Field
                      label="Distance label"
                      value={copy.receipt.distanceLabel}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, distanceLabel: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.distanceLabel}
                    />
                    <Field
                      label="Time out label"
                      value={copy.receipt.timeOutLabel}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, timeOutLabel: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.timeOutLabel}
                    />
                    <Field
                      label="Total label"
                      value={copy.receipt.totalLabel}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, totalLabel: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.totalLabel}
                    />
                    <Field
                      label="Total value"
                      value={copy.receipt.totalValue}
                      onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, totalValue: v } })}
                      placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.totalValue}
                    />
                  </div>
                  <Field
                    label="Footer"
                    value={copy.receipt.footer}
                    onChange={(v) => setCopy({ ...copy, receipt: { ...copy.receipt, footer: v } })}
                    placeholder={WRAPPED_TEMPLATE_DEFAULTS.receipt.footer}
                  />
                </>
              )}
            </div>
          </details>
        ))}
      </div>

      <motion.button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full px-6 py-3 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
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
