import { motion } from "framer-motion";
import {
  Home,
  CheckSquare,
  Gift,
  BookOpen,
  Shield,
  LogIn,
  LogOut,
  User,
  QrCode,
  Coffee,
  Menu,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { NavLink } from "./NavLink";
import { isAuthenticated } from "@/utils/adminAuth";
import AuthModal from "./AuthModal";
import { getCurrentUser, signOut, onAuthStateChange } from "@/utils/auth";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/** Mono uppercase masthead link — the nav's only voice on desktop. */
const MASTHEAD_LINK =
  "relative py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-gentle hover:text-foreground focus-visible:text-foreground focus-visible:outline-none";

/** Bordered mono control — the account button and the menu trigger share it. */
const CHROME_BUTTON =
  "inline-flex items-center gap-2 rounded-[10px] border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-gentle hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    getCurrentUser().then(setUser);
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
    { path: "/scan-qr", label: "Scan QR", icon: QrCode },
    { path: "/memory-book", label: "Memory Book", icon: BookOpen },
    { path: "/cafes", label: "Cafés", icon: Coffee },
    ...(authenticated ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container px-6">
        <div className="flex h-16 items-center justify-between gap-6 md:h-20">
          {/* ── Masthead ── */}
          <Link
            to="/"
            className="font-serif text-lg font-bold tracking-tight text-foreground transition-gentle hover:text-primary md:text-xl"
          >
            Your Special Day<span className="dot-accent">.</span>
          </Link>

          {/* ── Desktop: the nav is set, not decorated ── */}
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={MASTHEAD_LINK}
                  activeClassName="!text-foreground"
                >
                  {item.label}
                  {isActive && (
                    <motion.span
                      className="absolute inset-x-0 bottom-0 h-px bg-primary"
                      layoutId="mastheadActive"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* ── Account + mobile trigger ── */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className={CHROME_BUTTON}>
                  <User className="h-4 w-4" />
                  <span className="hidden max-w-[140px] truncate sm:inline">
                    {user.email || "Account"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem onSelect={() => navigate("/admin")}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleLogout();
                    }}
                    disabled={isLoggingOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isLoggingOut ? "Logging out…" : "Log out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className={CHROME_BUTTON}
                title="Log in or register"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Log in</span>
              </button>
            )}

            {/* Below lg the seven links can't fit a row — they fold into a sheet. */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger
                aria-label="Open menu"
                className={`${CHROME_BUTTON} px-2 lg:hidden`}
              >
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[86vw] max-w-sm px-6 py-8">
                <SheetTitle className="font-serif text-xl font-bold tracking-tight text-foreground">
                  Your Special Day<span className="dot-accent">.</span>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Every page on the site
                </SheetDescription>

                <ul className="mt-8 divide-y divide-border border-y border-border">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <SheetClose asChild>
                          <NavLink
                            to={item.path}
                            className="flex items-center gap-3 py-4 font-serif text-xl text-muted-foreground transition-gentle hover:text-foreground"
                            activeClassName="!text-foreground"
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                isActive ? "text-rose" : "text-muted-foreground"
                              }`}
                            />
                            {item.label}
                          </NavLink>
                        </SheetClose>
                      </li>
                    );
                  })}
                </ul>

                <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  {user ? user.email : "Not signed in"}
                </p>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          // Auth state updates via the onAuthStateChange listener
        }}
      />
    </nav>
  );
};

export default NavigationBar;
