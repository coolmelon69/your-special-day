import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import LoveNoteSection from "@/components/LoveNoteSection";
import TimeCapsule from "@/components/TimeCapsule";
import WrappedTeaserCard from "@/components/WrappedTeaserCard";
import FortuneTellerSection from "@/components/FortuneTellerSection";
import Footer from "@/components/Footer";
import { Sparkles, ArrowRight, Calendar } from "lucide-react";

const HomePage = () => {
  const navigate = useNavigate();

  const handleWrappedClick = () => {
    navigate('/wrapped');
  };

  return (
    <>
      <Helmet>
        <title>Happy Birthday, My Love! 💕</title>
        <meta name="description" content="A special birthday celebration website made with love" />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        <HeroSection />
        <GallerySection />
        
        {/* Wrapped Page Indicator Section */}
        <section className="py-12 md:py-20 bg-[hsl(35_40%_85%)] relative overflow-hidden">
          <div className="container px-6">
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  Your Year in Review
                </h2>
              </div>
              <p className="font-sans text-base sm:text-lg md:text-xl text-foreground/70 mb-8">
                Discover your relationship recap
              </p>
            </motion.div>

            <motion.div
              onClick={handleWrappedClick}
              className="relative max-w-2xl mx-auto bg-gradient-to-r from-primary via-secondary to-primary rounded-3xl p-8 md:p-12 cursor-pointer overflow-hidden shadow-xl border-4 border-primary/30"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 right-4">
                <Sparkles className="text-white/30" size={32} />
              </div>
              <div className="absolute bottom-4 left-4">
                <Sparkles className="text-white/20" size={24} />
              </div>

              {/* Animated background blob */}
              <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                  background: 'linear-gradient(135deg, hsl(340 65% 92%) 0%, hsl(30 50% 95%) 50%, hsl(143 30% 85%) 100%)',
                }}
                animate={{
                  x: [0, 50, -30, 0],
                  y: [0, -40, 30, 0],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Content */}
              <div className="relative z-10 text-center">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <span className="font-sans text-sm sm:text-base text-white font-medium">
                    New: Wrapped Available
                  </span>
                </motion.div>

                <motion.h3
                  className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  Your Year in Review is ready.
                </motion.h3>
                
                <motion.p
                  className="font-serif text-lg sm:text-xl md:text-2xl text-white/90 mb-8"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  Explore your relationship recap with personalized stats and memories
                </motion.p>

                <motion.div
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium hover:bg-white/30 transition-colors"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="font-sans text-base sm:text-lg md:text-xl">View Your Wrapped</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <LoveNoteSection />
        <TimeCapsule />
        <WrappedTeaserCard />
        <FortuneTellerSection />
        <Footer />
      </main>
    </>
  );
};

export default HomePage;
