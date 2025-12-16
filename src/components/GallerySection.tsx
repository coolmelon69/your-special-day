import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
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
  const { getAllPhotos } = useAdventure();
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    getAllPhotos().then(setUserPhotos);
  }, [getAllPhotos]);

  // Combine default photos with user photos
  const allPhotos = [
    ...defaultPhotos.map((photo, index) => ({
      ...photo,
      id: `default-${index}`,
      isUserPhoto: false,
    })),
    ...userPhotos.map((photo) => ({
      src: photo.src,
      caption: photo.caption || `Memory from ${photo.checkpointId}`,
      rotate: Math.random() * 6 - 3, // Random rotation between -3 and 3
      id: photo.id,
      isUserPhoto: true,
    })),
  ];
  return (
    <section id="gallery" className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Camera className="mx-auto mb-4 text-primary" size={36} />
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            The <span className="text-gradient-romantic">Us</span> Gallery
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A collection of our favorite memories together
          </p>
        </motion.div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {allPhotos.map((photo, index) => (
            <motion.div
              key={index}
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
      </div>
    </section>
  );
};

export default GallerySection;