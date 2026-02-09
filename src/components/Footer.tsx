import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-script text-2xl text-foreground">Made with</span>
            <Heart className="text-primary animate-pulse-soft" size={24} fill="currentColor" />
            <span className="font-script text-2xl text-foreground">by Melon</span>
            <img 
              src="/images/gallery/melody.png" 
              alt="Melody" 
              className="w-24 h-24 md:w-32 md:h-32 ml-2"
              style={{ imageRendering: "auto" }}
            />
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;