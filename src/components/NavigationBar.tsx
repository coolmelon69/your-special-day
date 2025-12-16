import { motion } from "framer-motion";
import { Home, CheckSquare, Gift, BookOpen } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "./NavLink";
import { useAdventure } from "@/contexts/AdventureContext";
import { useEffect, useState } from "react";

const NavigationBar = () => {
  const location = useLocation();
  const { getAllPhotos } = useAdventure();
  const [hasPhotos, setHasPhotos] = useState(false);

  useEffect(() => {
    getAllPhotos().then((photos) => {
      setHasPhotos(photos.length > 0);
    });
  }, [getAllPhotos]);
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/stamps", label: "Stamps", icon: CheckSquare },
    { path: "/coupons", label: "Coupons", icon: Gift },
    ...(hasPhotos ? [{ path: "/memory-book", label: "Memory Book", icon: BookOpen }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-romantic/95 backdrop-blur-md border-b-2 border-primary/20 shadow-lg" style={{ imageRendering: "pixelated" }}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-center h-16 md:h-20">
          {/* Pixel-art border decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-2 h-2 border-2 border-primary/30" />
            <div className="absolute top-0 right-0 w-2 h-2 border-2 border-primary/30" />
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-pixel text-sm md:text-base transition-all text-muted-foreground hover:text-primary hover:bg-primary/5"
                  activeClassName="text-primary bg-primary/10"
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">{item.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  
                  {/* Pixel-art corner decorations for active state */}
                  {isActive && (
                    <>
                      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-primary" />
                      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-primary" />
                      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-primary" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-primary" />
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;

