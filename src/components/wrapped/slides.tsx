import { Camera, Clock, Sticker, Trophy } from "lucide-react";
import { DisplayHeading, EditorialFigure, Eyebrow, Pill, StatBlock } from "@/components/editorial";
import { formatClock, formatDuration } from "@/utils/wrappedStats";
import type { WrappedStats } from "@/types/wrapped";
import { INTRO, type Award } from "./copy";

interface SlideProps {
  stats: WrappedStats;
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

export const IntroSlide = ({ stats }: SlideProps) => (
  <Frame center>
    <Eyebrow no="Nº 01" className="mb-6">
      {INTRO.eyebrow}
    </Eyebrow>
    <DisplayHeading className="mb-6">
      {INTRO.headingBefore}
      <br />
      <em>{INTRO.headingEmphasis}</em>?
    </DisplayHeading>
    <p className="font-mono text-[13px] uppercase tracking-[0.12em] text-muted-foreground mt-4">
      {stats.isMock ? INTRO.mockHint : INTRO.hint}
    </p>
  </Frame>
);

export const NumbersSlide = ({ stats }: SlideProps) => (
  <Frame>
    <Eyebrow className="mb-4">The Tally</Eyebrow>
    <DisplayHeading as="h2" className="mb-10">
      The numbers are <em>in</em>.
    </DisplayHeading>
    <div className="grid grid-cols-2 gap-x-8 gap-y-10 w-full">
      <StatBlock value={stats.stampsCollected} unit={`/ ${stats.stampsTotal}`} label="Stamps collected" />
      <StatBlock value={stats.photosTaken} label="Photos taken" />
      <StatBlock value={stats.couponsRedeemed} label="Coupons redeemed" />
      <StatBlock value={stats.distanceKm.toFixed(1)} unit="km" label="Ground covered" />
    </div>
  </Frame>
);

export const TimeSlide = ({ stats }: SlideProps) => (
  <Frame>
    <Eyebrow className="mb-4">The Day, End To End</Eyebrow>
    <DisplayHeading as="h2" className="mb-10">
      You were out for <em>{formatDuration(stats.spanMinutes)}</em>.
    </DisplayHeading>
    <div className="flex flex-wrap gap-2 mb-10">
      <Pill icon={<Clock />}>
        First stamp {stats.firstStampAt !== null ? formatClock(stats.firstStampAt) : "—"}
      </Pill>
      <Pill icon={<Clock />} variant="rose">
        Last stamp {stats.lastStampAt !== null ? formatClock(stats.lastStampAt) : "—"}
      </Pill>
    </div>
    <StatBlock
      value={formatDuration(stats.longestGapMinutes)}
      label="Longest stretch between two stamps"
    />
  </Frame>
);

export const TopMomentSlide = ({ stats }: SlideProps) => (
  <Frame>
    <Eyebrow className="mb-4">Your Top Moment</Eyebrow>
    <DisplayHeading as="h2" className="mb-8">
      <em>{stats.topMoment?.title ?? "Still to come"}</em>.
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
            {stats.topMoment.photoCount} photos
          </span>
        ) : undefined
      }
      caption="The checkpoint you photographed most"
    />
  </Frame>
);

export const PhotoStatsSlide = ({ stats }: SlideProps) => (
  <Frame>
    <Eyebrow className="mb-4">Behind The Lens</Eyebrow>
    <DisplayHeading as="h2" className="mb-10">
      You could not stop <em>pressing the button</em>.
    </DisplayHeading>
    <div className="grid grid-cols-2 gap-8 w-full mb-8">
      <StatBlock value={stats.photosTaken} label="Photos taken" />
      <StatBlock value={stats.stickersPlaced} label="Stickers stuck on" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Pill icon={<Sticker />}>Favourite filter: {stats.favouriteFilter ?? "none yet"}</Pill>
    </div>
  </Frame>
);

export const AwardSlide = ({ award }: { award: Award }) => (
  <Frame center>
    <Eyebrow className="mb-6">{award.eyebrow}</Eyebrow>
    <Trophy className="w-4 h-4 text-rose mb-6" />
    <DisplayHeading as="h2" className="mb-8">
      {award.title}
    </DisplayHeading>
    <p className="font-serif text-2xl text-rose italic mb-4">{award.recipient}</p>
    <p className="text-muted-foreground max-w-[36ch]">{award.note}</p>
  </Frame>
);
