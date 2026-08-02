import { useCallback, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useWrappedStats } from "@/hooks/useWrappedStats";
import StoryShell, { type Slide } from "@/components/wrapped/StoryShell";
import RouteMapSlide from "@/components/wrapped/RouteMapSlide";
import ReceiptSlide from "@/components/wrapped/ReceiptSlide";
import ShareCardSlide from "@/components/wrapped/ShareCardSlide";
import {
  AwardSlide,
  IntroSlide,
  NumbersSlide,
  PhotoStatsSlide,
  TimeSlide,
  TopMomentSlide,
} from "@/components/wrapped/slides";
import { AWARDS } from "@/components/wrapped/copy";

const WrappedPage = () => {
  const navigate = useNavigate();
  const stats = useWrappedStats();

  // Bumping the key remounts StoryShell, which resets it to slide one.
  const [runKey, setRunKey] = useState(0);
  const replay = useCallback(() => setRunKey((k) => k + 1), []);

  const slides: Slide[] = useMemo(
    () => [
      { id: "intro", duration: 6000, render: () => <IntroSlide stats={stats} /> },
      { id: "numbers", duration: 8000, render: () => <NumbersSlide stats={stats} /> },
      { id: "time", duration: 8000, render: () => <TimeSlide stats={stats} /> },
      { id: "route", duration: 9000, render: () => <RouteMapSlide stats={stats} /> },
      { id: "top-moment", duration: 8000, render: () => <TopMomentSlide stats={stats} /> },
      { id: "photo-stats", duration: 8000, render: () => <PhotoStatsSlide stats={stats} /> },
      // Longer: this slide carries more reading than the others.
      { id: "receipt", duration: 12000, render: () => <ReceiptSlide stats={stats} /> },
      { id: "award-1", duration: 7000, render: () => <AwardSlide award={AWARDS[0]} /> },
      { id: "award-2", duration: 7000, render: () => <AwardSlide award={AWARDS[1]} /> },
      // Long enough that the story does not close itself while the user is
      // deciding whether to save the card.
      {
        id: "share",
        duration: 600000,
        render: () => <ShareCardSlide stats={stats} onReplay={replay} />,
      },
    ],
    [stats, replay],
  );

  return (
    <>
      <Helmet>
        <title>Your 2025 Wrapped - Your Special Day</title>
      </Helmet>
      <StoryShell
        key={runKey}
        slides={slides}
        audioSrc="/music/glue.mp3"
        onClose={() => navigate("/")}
      />
    </>
  );
};

export default WrappedPage;
