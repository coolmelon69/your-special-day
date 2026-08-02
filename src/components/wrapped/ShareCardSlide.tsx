import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Download, RotateCcw } from "lucide-react";
import { DisplayHeading, Eyebrow } from "@/components/editorial";
import { formatDuration } from "@/utils/wrappedStats";
import type { WrappedStats } from "@/types/wrapped";

interface ShareCardSlideProps {
  stats: WrappedStats;
  onReplay: () => void;
}

const ShareCardSlide = ({ stats, onReplay }: ShareCardSlideProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const download = async () => {
    if (!cardRef.current) return;
    setSaving(true);

    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        // The card sits on a translucent surface; without this the PNG has a
        // transparent background that reads as black in most viewers.
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = "our-wrapped.png";
      link.href = dataUrl;
      link.click();
    } catch {
      // Export failure must never break the slideshow. The card stays on
      // screen either way.
      toast.error("Could not save the image — screenshot this card instead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center items-center px-6 w-full gap-6">
      <div
        ref={cardRef}
        className="w-full max-w-sm bg-card border border-border rounded-2xl px-7 py-8"
      >
        <Eyebrow no="2025" className="mb-5">
          Our Wrapped
        </Eyebrow>
        <DisplayHeading as="h2" className="mb-7">
          One very <em>good</em> day.
        </DisplayHeading>

        <dl className="space-y-3 font-mono text-[12px]">
          <div className="flex justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Stamps</dt>
            <dd>
              {stats.stampsCollected} / {stats.stampsTotal}
            </dd>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Photos</dt>
            <dd>{stats.photosTaken}</dd>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <dt className="text-muted-foreground">Distance</dt>
            <dd>{stats.distanceKm.toFixed(1)} km</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Time out</dt>
            <dd>{formatDuration(stats.spanMinutes)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex gap-3">
        <button
          onClick={download}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm disabled:opacity-60 transition-opacity"
        >
          <Download className="w-4 h-4" />
          {saving ? "Saving…" : "Save as image"}
        </button>
        <button
          onClick={onReplay}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted-foreground text-sm hover:text-foreground hover:border-foreground transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Replay
        </button>
      </div>
    </div>
  );
};

export default ShareCardSlide;
