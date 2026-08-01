import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import LoveNoteSection from "@/components/LoveNoteSection";
import WrappedTeaserCard from "@/components/WrappedTeaserCard";
import FortuneTellerSection from "@/components/FortuneTellerSection";
import Footer from "@/components/Footer";

const HomePage = () => {

  return (
    <>
      <Helmet>
        <title>Happy birthday, Mochi — Your Special Day</title>
        <meta name="description" content="One whole day for Mochi, kept in one place: the itinerary, the photos, and every coupon there is to cash in." />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        <HeroSection />
        <GallerySection />
        <LoveNoteSection />
        <WrappedTeaserCard />
        <FortuneTellerSection />
        <Footer />
        <Link 
          to="/camera" 
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 no-print"
          aria-label="Open Camera"
        >
          <Camera size={24} />
        </Link>
      </main>
    </>
  );
};

export default HomePage;
