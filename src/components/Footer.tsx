import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { isAuthenticated } from "@/utils/adminAuth";

const Footer = () => {
  const authenticated = isAuthenticated();

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
            <span className="font-script text-2xl text-foreground">for you by Melon</span>
          </div>
          <p className="text-muted-foreground text-sm mb-2">
            Here's to many more birthdays together! 🥂
          </p>
          {authenticated && (
            <Link
              to="/admin"
              className="inline-block text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors font-pixel"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Admin Panel
            </Link>
          )}
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;