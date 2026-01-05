import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useAdventure } from "@/contexts/AdventureContext";
import type { Photo } from "@/components/TimelineSection";

const defaultPhotos = [
  {
    // To use custom images, place them in: public/images/gallery/
    // Then reference them like: "/images/gallery/photo1.jpg"
    src: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=500&fit=crop",
    // Example for local image: src: "/images/gallery/photo1.jpg",
    caption: "Our first adventure together 💕",
    rotate: -3,
  },
  {
    src: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop",
    // Example for local image: src: "/images/gallery/photo2.jpg",
    caption: "That magical sunset walk",
    rotate: 2,
  },
  {
    src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=400&fit=crop",
    // Example for local image: src: "/images/gallery/photo3.jpg",
    caption: "Coffee dates are our thing ☕",
    rotate: -2,
  },
  {
    src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop",
    // Example for local image: src: "/images/gallery/photo4.jpg",
    caption: "our first gig hangout!",
    rotate: 3,
  },
  {
    src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=350&fit=crop",
    // Example for local image: src: "/images/gallery/photo5.jpg",
    caption: "Your beautiful smile",
    rotate: -1,
  },
  {
    src: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=450&fit=crop",
    // Example for local image: src: "/images/gallery/photo6.jpg",
    caption: "Best road trip ever! 🚗",
    rotate: 2,
  },
];

const GallerySection = () => {
  const { photos, user } = useAdventure();

  // Helper function to generate stable rotation based on photo ID
  const getStableRotation = (id: string): number => {
    // Simple hash function to generate consistent rotation from ID
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return (Math.abs(hash) % 6) - 3; // Rotation between -3 and 3
  };

  // Conditional photo display logic:
  // - If user is logged in AND has photos: show only user photos (hide defaults)
  // - If user is logged in BUT no photos: show empty state
  // - If user is not logged in: show default photos
  const allPhotos = user && photos.length > 0
    ? photos.map((photo) => ({
        src: photo.src,
        caption: photo.caption || `Memory from ${photo.checkpointId}`,
        rotate: getStableRotation(photo.id), // Stable rotation based on photo ID
        id: photo.id,
        isUserPhoto: true,
      }))
    : user && photos.length === 0
    ? [] // Empty when logged in but no photos
    : defaultPhotos.map((photo, index) => ({
        ...photo,
        id: `default-${index}`,
        isUserPhoto: false,
      }));
  return (
    <section id="gallery" className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            The <span className="text-gradient-romantic">Us</span> Gallery
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A collection of our favorite memories together
          </p>
        </motion.div>

        {allPhotos.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {allPhotos.map((photo, index) => (
              <motion.div
                key={photo.id || index}
                className="break-inside-avoid"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <motion.div
                  className="relative bg-[hsl(35_40%_88%)] p-2 pb-4 shadow-lg cursor-pointer"
                  style={{ 
                    rotate: photo.rotate,
                    imageRendering: "pixelated"
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: 0,
                    boxShadow: "0 20px 40px -10px hsl(340 70% 65% / 0.3)"
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Pixelated frame border - pinkish color theme */}
                  <div className="relative border-4 border-[hsl(340_70%_65%)] p-1" style={{ imageRendering: "pixelated" }}>
                    {/* Inner border */}
                    <div className="border-2 border-[hsl(340_60%_70%)] relative">
                      {/* Corner decorations - matching stamp style */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-2 border-[hsl(340_70%_65%)] bg-[hsl(340_70%_65%)]" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-2 border-[hsl(340_70%_65%)] bg-[hsl(340_70%_65%)]" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-2 border-[hsl(340_70%_65%)] bg-[hsl(340_70%_65%)]" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-2 border-[hsl(340_70%_65%)] bg-[hsl(340_70%_65%)]" />
                      
                      {/* Decorative border pattern - pixelated dots */}
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Top border pattern */}
                        <div className="absolute top-0 left-0 right-0 h-2 flex gap-0.5 px-1">
                          {[...Array(12)].map((_, i) => (
                            <div key={`top-${i}`} className="w-1 h-1 bg-[hsl(340_70%_65%)] mt-0.5" />
                          ))}
                        </div>
                        {/* Bottom border pattern */}
                        <div className="absolute bottom-0 left-0 right-0 h-2 flex gap-0.5 px-1">
                          {[...Array(12)].map((_, i) => (
                            <div key={`bottom-${i}`} className="w-1 h-1 bg-[hsl(340_70%_65%)] mb-0.5" />
                          ))}
                        </div>
                        {/* Left border pattern */}
                        <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col gap-0.5 py-1">
                          {[...Array(8)].map((_, i) => (
                            <div key={`left-${i}`} className="w-1 h-1 bg-[hsl(340_70%_65%)] ml-0.5" />
                          ))}
                        </div>
                        {/* Right border pattern */}
                        <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col gap-0.5 py-1">
                          {[...Array(8)].map((_, i) => (
                            <div key={`right-${i}`} className="w-1 h-1 bg-[hsl(340_70%_65%)] mr-0.5" />
                          ))}
                        </div>
                      </div>
                      
                      {/* Image container */}
                      <div className="overflow-hidden relative z-10">
                        <motion.img
                          src={photo.src}
                          alt={photo.caption}
                          className="w-full h-auto object-cover"
                          style={{ imageRendering: "pixelated" }}
                          whileHover={{ scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Caption with pixelated font */}
                  <p 
                    className="font-pixel text-sm md:text-base text-center text-[hsl(340_60%_50%)] mt-3"
                    style={{ 
                      textRendering: "optimizeSpeed",
                      WebkitFontSmoothing: "none",
                      MozOsxFontSmoothing: "unset",
                      fontSmooth: "never",
                      letterSpacing: "0.05em"
                    }}
                  >
                    {photo.caption}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        ) : user ? (
          // Empty state when user is logged in but has no photos
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200,
                damping: 10,
                delay: 0.2
              }}
            >
              <Camera className="mx-auto mb-6 text-primary" size={64} />
            </motion.div>
            <motion.h3
              className="font-serif text-2xl md:text-3xl font-bold mb-3 text-gradient-romantic bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Your Gallery Awaits ✨
            </motion.h3>
            <motion.p
              className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="text-primary font-medium">Add photos to your stamps</span> to start building your collection of memories 💕
            </motion.p>
            <motion.div
              className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span>📸</span>
              <span>🎞️</span>
              <span>💖</span>
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
};

export default GallerySection;