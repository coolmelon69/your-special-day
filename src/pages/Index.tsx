import { Helmet } from "react-helmet-async";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import TimelineSection from "@/components/TimelineSection";
import LoveNoteSection from "@/components/LoveNoteSection";
import GiftCouponsSection from "@/components/GiftCouponsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Happy Birthday, My Love! 💕</title>
        <meta name="description" content="A special birthday celebration website made with love" />
      </Helmet>
      
      <main className="overflow-x-hidden">
        <HeroSection />
        <GallerySection />
        <TimelineSection />
        <LoveNoteSection />
        <GiftCouponsSection />
        <Footer />
      </main>
    </>
  );
};

export default Index;