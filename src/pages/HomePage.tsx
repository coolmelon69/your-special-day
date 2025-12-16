import { Helmet } from "react-helmet-async";
import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import TimelineSection, { type ItineraryItem } from "@/components/TimelineSection";
import LoveNoteSection from "@/components/LoveNoteSection";
import FortuneTellerSection from "@/components/FortuneTellerSection";
import Footer from "@/components/Footer";
import { useAdventure } from "@/contexts/AdventureContext";

const HomePage = () => {
  const { itineraryState, setItineraryState } = useAdventure();
  const [selectedEvent, setSelectedEvent] = useState<ItineraryItem | null>(null);

  return (
    <>
      <Helmet>
        <title>Happy Birthday, My Love! 💕</title>
        <meta name="description" content="A special birthday celebration website made with love" />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        <HeroSection />
        <GallerySection />
        <TimelineSection 
          itineraryState={itineraryState}
          setItineraryState={setItineraryState}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
        />
        <LoveNoteSection />
        <FortuneTellerSection />
        <Footer />
      </main>
    </>
  );
};

export default HomePage;
