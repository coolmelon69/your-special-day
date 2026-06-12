import { motion } from "framer-motion";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-accent/40 border-t border-border">
      <div className="container px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-serif text-2xl font-light text-foreground">Made with</span>
            <Heart className="text-primary animate-pulse-soft" size={20} fill="currentColor" />
            <span className="font-serif text-2xl font-light text-foreground italic">by Melon</span>
          </div>
          <p className="font-mono-caption text-muted-foreground/60 mt-4">made with love ♡</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;