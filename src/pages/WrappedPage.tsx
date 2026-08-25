import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useWrappedStats } from "@/hooks/useWrappedStats";
import StoryShell, { type Slide } from "@/components/wrapped/StoryShell";
import RouteMapSlide from "@/components/wrapped/RouteMapSlide";
import ReceiptSlide from "@/components/wrapped/ReceiptSlide";
import ShareCardSlide from "@/components/wrapped/ShareCardSlide";
import {
  CustomSlide,
  IntroSlide,
  NumbersSlide,
  PhotoStatsSlide,
  TimeSlide,
  TopMomentSlide,
} from "@/components/wrapped/slides";
import { useCustomWrappedSlides } from "@/hooks/useCustomWrappedSlides";
import { useWrappedTemplateCopy } from "@/hooks/useWrappedTemplateCopy";

const WrappedPage = () => {
  const navigate = useNavigate();
  const stats = useWrappedStats();
  const customSlides = useCustomWrappedSlides();
  const copy = useWrappedTemplateCopy();

  // Bumping the key remounts StoryShell, which resets it to slide one.
  const [runKey, setRunKey] = useState(0);
  const replay = useCallback(() => setRunKey((k) => k + 1), []);

  const slides: Slide[] = useMemo(
    () => [
      { id: "intro", duration: 6000, render: () => <IntroSlide stats={stats} copy={copy} /> },
      { id: "numbers", duration: 8000, render: () => <NumbersSlide stats={stats} copy={copy} /> },
      { id: "time", duration: 8000, render: () => <TimeSlide stats={stats} copy={copy} /> },
      { id: "route", duration: 9000, render: () => <RouteMapSlide stats={stats} copy={copy} /> },
      { id: "top-moment", duration: 8000, render: () => <TopMomentSlide stats={stats} copy={copy} /> },
      { id: "photo-stats", duration: 8000, render: () => <PhotoStatsSlide stats={stats} copy={copy} /> },
      // Longer: this slide carries more reading than the others.
      { id: "receipt", duration: 12000, render: () => <ReceiptSlide stats={stats} copy={copy} /> },
      ...customSlides.map((slide) => ({
        id: `custom-${slide.id}`,
        duration: 7000,
        render: () => <CustomSlide slide={slide} />,
      })),
      // Long enough that the story does not close itself while the user is
      // deciding whether to save the card.
      {
        id: "share",
        duration: 600000,
        render: () => <ShareCardSlide stats={stats} onReplay={replay} />,
      },
    ],
    [stats, replay, customSlides, copy],
  );

  return (
    <>
      <Helmet>
        <title>Your 2025 Wrapped - Your Special Day</title>
      </Helmet>
      <StoryShell
        key={runKey}
        slides={slides}
        audioSrc="/music/beside_you.mp3"
        onClose={() => navigate("/")}
      />
    </>
  );
};

export default WrappedPage;
