import { Helmet } from "react-helmet-async";
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
        <title>Happy Birthday, My Love! 💕</title>
        <meta name="description" content="A special birthday celebration website made with love" />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        <HeroSection />
        <GallerySection />
        <LoveNoteSection />
        <WrappedTeaserCard />
        <FortuneTellerSection />
        <Footer />
      </main>
    </>
  );
};

export default HomePage;
