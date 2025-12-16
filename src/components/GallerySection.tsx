import { motion } from "framer-motion";
import { Camera } from "lucide-react";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?w=400&h=500&fit=crop",
    caption: "Our first adventure together 💕",
    rotate: -3,
  },
  {
    src: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=400&h=300&fit=crop",
    caption: "That magical sunset walk",
    rotate: 2,
  },
  {
    src: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=400&h=400&fit=crop",
    caption: "Coffee dates are our thing ☕",
    rotate: -2,
  },
  {
    src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=400&h=500&fit=crop",
    caption: "Dancing under the stars ✨",
    rotate: 3,
  },
  {
    src: "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&h=350&fit=crop",
    caption: "Your beautiful smile",
    rotate: -1,
  },
  {
    src: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=400&h=450&fit=crop",
    caption: "Best road trip ever! 🚗",
    rotate: 2,
  },
];

const GallerySection = () => {
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
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              className="break-inside-avoid"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <motion.div
                className="bg-card p-3 pb-4 rounded-lg shadow-lg cursor-pointer"
                style={{ rotate: photo.rotate }}
                whileHover={{ 
                  scale: 1.05, 
                  rotate: 0,
                  boxShadow: "0 20px 40px -10px hsl(340 65% 65% / 0.3)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="overflow-hidden rounded-md mb-3">
                  <motion.img
                    src={photo.src}
                    alt={photo.caption}
                    className="w-full h-auto object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="font-script text-lg text-center text-foreground/80">
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