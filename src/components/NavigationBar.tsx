import { motion } from "framer-motion";
import { Home, CheckSquare, Gift, BookOpen, Shield, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "./NavLink";
import { isAuthenticated } from "@/utils/adminAuth";
import AuthModal from "./AuthModal";
import { getCurrentUser, signOut, onAuthStateChange } from "@/utils/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    // Get initial user
    getCurrentUser().then(setUser);

    // Subscribe to auth changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/stamps", label: "Stamps", icon: CheckSquare },
    { path: "/coupons", label: "Coupons", icon: Gift },
    { path: "/memory-book", label: "Memory Book", icon: BookOpen },
    ...(authenticated ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-romantic/95 backdrop-blur-md border-b-2 border-primary/20 shadow-lg" style={{ imageRendering: "pixelated" }}>
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-center h-16 md:h-20">
          {/* Pixel-art border decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-2 h-2 border-2 border-primary/30" />
            <div className="absolute top-0 right-0 w-2 h-2 border-2 border-primary/30" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
            {/* Auth Button / User State */}
            {user ? (
              <div className="relative group">
                <button
                  className="relative flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 md:py-3 rounded-lg font-pixel text-sm md:text-base transition-all text-muted-foreground hover:text-primary hover:bg-primary/5"
                  title={user.email || "User"}
                >
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline max-w-[120px] md:max-w-[150px] truncate">
                    {user.email || "User"}
                  </span>
                </button>
                {/* User dropdown */}
                <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 bg-[hsl(35_40%_90%)] border-2 border-[hsl(30_40%_60%)] rounded-lg shadow-lg min-w-[150px] z-50 overflow-hidden">
                  <button
                    onClick={() => navigate("/admin")}
                    className="w-full flex items-center gap-2 px-4 py-2 font-pixel text-sm text-[hsl(15_70%_40%)] hover:bg-[hsl(15_70%_55%)] hover:text-white transition-all border-b border-[hsl(30_40%_60%)]"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    <Shield className="w-4 h-4" />
                    Admin
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-4 py-2 font-pixel text-sm text-[hsl(15_70%_40%)] hover:bg-[hsl(0_60%_50%)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    <LogOut className="w-4 h-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="relative flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 md:py-3 rounded-lg font-pixel text-sm md:text-base transition-all text-muted-foreground hover:text-primary hover:bg-primary/5"
                title="Login or Register"
              >
                <LogIn className="w-4 h-4 md:w-5 md:h-5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative flex items-center gap-2 px-3 sm:px-4 md:px-5 lg:px-6 py-2 md:py-3 rounded-lg font-pixel text-sm md:text-base transition-all text-muted-foreground hover:text-primary hover:bg-primary/5"
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // Auth state will update via the useEffect listener
        }}
      />
    </nav>
  );
};

export default NavigationBar;

