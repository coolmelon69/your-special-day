import { Camera, Clock, Heart, Sparkles, Sticker, Star, Trophy } from "lucide-react";
import { DisplayHeading, EditorialFigure, Eyebrow, Pill, StatBlock } from "@/components/editorial";
import { formatClock, formatDuration } from "@/utils/wrappedStats";
import type { WrappedStats } from "@/types/wrapped";
import type { CustomWrappedSlide, WrappedSlideIcon, WrappedTemplateCopy } from "@/types/admin";
import { applyHeadingTokens, applyTokens } from "@/utils/wrappedTemplate";

interface SlideProps {
  stats: WrappedStats;
  copy: WrappedTemplateCopy;
}

/** Shared frame so every slide sits on the same rhythm. */
const Frame = ({ children, center = false }: { children: React.ReactNode; center?: boolean }) => (
  <div
    className={`flex flex-col h-full justify-center px-6 max-w-2xl mx-auto w-full ${
      center ? "items-center text-center" : ""
    }`}
  >
    {children}
  </div>
);

export const IntroSlide = ({ stats, copy }: SlideProps) => (
  <Frame center>
    <Eyebrow no="Nº 01" className="mb-6">
      {copy.intro.eyebrow}
    </Eyebrow>
    <DisplayHeading className="mb-6">
      {copy.intro.heading.before}
      <br />
      <em>{copy.intro.heading.emphasis}</em>
      {copy.intro.heading.after}
    </DisplayHeading>
    <p className="font-mono text-[13px] uppercase tracking-[0.12em] text-muted-foreground mt-4">
      {stats.isMock ? copy.intro.mockHint : copy.intro.hint}
    </p>
  </Frame>
);

export const NumbersSlide = ({ stats, copy }: SlideProps) => (
  <Frame>
    <Eyebrow className="mb-4">{copy.numbers.eyebrow}</Eyebrow>
    <DisplayHeading as="h2" className="mb-10">
      {copy.numbers.heading.before}
      <em>{copy.numbers.heading.emphasis}</em>
      {copy.numbers.heading.after}
    </DisplayHeading>
    <div className="grid grid-cols-2 gap-x-8 gap-y-10 w-full">
      <StatBlock
        value={stats.stampsCollected}
        unit={`/ ${stats.stampsTotal}`}
        label={copy.numbers.statLabels.stamps}
      />
      <StatBlock value={stats.photosTaken} label={copy.numbers.statLabels.photos} />
      <StatBlock value={stats.couponsRedeemed} label={copy.numbers.statLabels.coupons} />
      <StatBlock value={stats.distanceKm.toFixed(1)} unit="km" label={copy.numbers.statLabels.distance} />
    </div>
  </Frame>
);

export const TimeSlide = ({ stats, copy }: SlideProps) => {
  const heading = applyHeadingTokens(copy.time.heading, {
    duration: formatDuration(stats.spanMinutes),
  });
  const firstStampText = applyTokens(copy.time.firstStampLabel, {
    time: stats.firstStampAt !== null ? formatClock(stats.firstStampAt) : "—",
  });
  const lastStampText = applyTokens(copy.time.lastStampLabel, {
    time: stats.lastStampAt !== null ? formatClock(stats.lastStampAt) : "—",
  });

  return (
    <Frame>
      <Eyebrow className="mb-4">{copy.time.eyebrow}</Eyebrow>
      <DisplayHeading as="h2" className="mb-10">
        {heading.before}
        <em>{heading.emphasis}</em>
        {heading.after}
      </DisplayHeading>
      <div className="flex flex-wrap gap-2 mb-10">
        <Pill icon={<Clock />}>{firstStampText}</Pill>
        <Pill icon={<Clock />} variant="rose">
          {lastStampText}
        </Pill>
      </div>
      <StatBlock value={formatDuration(stats.longestGapMinutes)} label={copy.time.longestGapLabel} />
    </Frame>
  );
};

export const TopMomentSlide = ({ stats, copy }: SlideProps) => {
  const heading = applyHeadingTokens(copy.topMoment.heading, {
    title: stats.topMoment?.title ?? "Still to come",
  });
  const photosText = applyTokens(copy.topMoment.photosLabel, {
    count: String(stats.topMoment?.photoCount ?? 0),
  });

  return (
    <Frame>
      <Eyebrow className="mb-4">{copy.topMoment.eyebrow}</Eyebrow>
      <DisplayHeading as="h2" className="mb-8">
        {heading.before}
        <em>{heading.emphasis}</em>
        {heading.after}
      </DisplayHeading>
      <EditorialFigure
        src="/placeholder.svg"
        alt={stats.topMoment?.title ?? "Top moment"}
        aspectClassName="aspect-[4/3]"
        dotGrid="br"
        annotate={
          stats.topMoment ? (
            <span className="inline-flex items-center gap-2">
              <Camera className="w-4 h-4 text-rose" />
              {photosText}
            </span>
          ) : undefined
        }
        caption={copy.topMoment.caption}
      />
    </Frame>
  );
};

export const PhotoStatsSlide = ({ stats, copy }: SlideProps) => (
  <Frame>
    <Eyebrow className="mb-4">{copy.photoStats.eyebrow}</Eyebrow>
    <DisplayHeading as="h2" className="mb-10">
      {copy.photoStats.heading.before}
      <em>{copy.photoStats.heading.emphasis}</em>
      {copy.photoStats.heading.after}
    </DisplayHeading>
    <div className="grid grid-cols-2 gap-8 w-full mb-8">
      <StatBlock value={stats.photosTaken} label={copy.photoStats.photosLabel} />
      <StatBlock value={stats.stickersPlaced} label={copy.photoStats.stickersLabel} />
    </div>
    <div className="flex flex-wrap gap-2">
      <Pill icon={<Sticker />}>
        {applyTokens(copy.photoStats.filterLabel, { filter: stats.favouriteFilter ?? "none yet" })}
      </Pill>
    </div>
  </Frame>
);

const WRAPPED_SLIDE_ICON_MAP: Record<WrappedSlideIcon, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  heart: Heart,
  star: Star,
  camera: Camera,
  sparkles: Sparkles,
};

export const CustomSlide = ({ slide }: { slide: CustomWrappedSlide }) => {
  const Icon = slide.icon ? WRAPPED_SLIDE_ICON_MAP[slide.icon] : null;
  return (
    <Frame center>
      <Eyebrow className="mb-6">{slide.eyebrow}</Eyebrow>
      {Icon && <Icon className="w-4 h-4 text-rose mb-6" />}
      <DisplayHeading as="h2" className="mb-8">
        {slide.heading}
      </DisplayHeading>
      {slide.emphasis && (
        <p className="font-serif text-2xl text-rose italic mb-4">{slide.emphasis}</p>
      )}
      <p className="text-muted-foreground max-w-[36ch]">{slide.body}</p>
    </Frame>
  );
};
