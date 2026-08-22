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
  IdCard,
  HeartHandshake,
  Backpack,
  Store,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { NavLink } from "./NavLink";
import { isAuthenticated, isSiteUnlocked } from "@/utils/adminAuth";
import AuthModal from "./AuthModal";
import { getCurrentUser, signOut, onAuthStateChange } from "@/utils/auth";
import { useAdventure } from "@/contexts/AdventureContext";
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
  "inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-[10px] border border-border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground transition-gentle hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The three panels of /trainer-card, which the page selects with `?tab=`.
 *  Card is the default, so it carries no param — a bare /trainer-card link. */
const PROFILE_TABS = [
  { tab: "card", label: "Card", icon: IdCard },
  { tab: "bag", label: "Bag", icon: Backpack },
  { tab: "shop", label: "Shop", icon: Store },
] as const;

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Carries the rose accent — reserved for the pairing prompt, which is the
   *  one nav entry asking for something rather than pointing somewhere. */
  accent?: boolean;
}

const NavigationBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const siteUnlocked = isSiteUnlocked();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { trainerCardEnabled, profile, isLinked } = useAdventure();

  /** The pairing form lives on /trainer-card, so the prompt is a route, not a
   *  modal. Hidden once you're standing on that page — the form is already in
   *  view there, and a second entry to the page you're on would light up the
   *  active state twice. `profile` gates it because `redeem_invite` refuses a
   *  code from an account with no profile row (`no_profile`). */
  const showPairPrompt =
    siteUnlocked && !!user && !!profile && !isLinked && location.pathname !== "/trainer-card";

  /** Which trainer-card panel is showing, mirroring the page's own fallback:
   *  an absent or unknown `?tab=` means Card. Router's NavLink matches on path
   *  alone, so the sub-items compare this themselves or all three light up. */
  const activeProfileTab = new URLSearchParams(location.search).get("tab") ?? "card";
  const [profileOpen, setProfileOpen] = useState(location.pathname === "/trainer-card");

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

  // Locked out of the private site? The café list is all there is to navigate.
  const navItems: NavItem[] = !siteUnlocked
    ? [{ path: "/cafes", label: "Cafés", icon: Coffee }]
    : [
    { path: "/", label: "Home", icon: Home },
    { path: "/stamps", label: "Stamps", icon: CheckSquare },
    { path: "/coupons", label: "Coupons", icon: Gift },
    { path: "/scan-qr", label: "Scan QR", icon: QrCode },
    { path: "/memory-book", label: "Memory Book", icon: BookOpen },
    ...(trainerCardEnabled ? [{ path: "/trainer-card", label: "Profile", icon: IdCard }] : []),
    { path: "/cafes", label: "Cafés", icon: Coffee },
    ...(authenticated ? [{ path: "/admin", label: "Admin", icon: Shield }] : []),
    // Last in the row so it reads as an invitation at the end of the set,
    // not as another place the site expects you to already know about.
    ...(showPairPrompt
      ? [{ path: "/trainer-card", label: "Link partner", icon: HeartHandshake, accent: true }]
      : []),
  ];

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="container px-6">
        <div className="flex h-16 items-center justify-between gap-6 md:h-20">
          {/* ── Masthead ── */}
          <Link
            to={siteUnlocked ? "/" : "/cafes"}
            className="tap-44 inline-flex items-center font-serif text-lg font-bold tracking-tight text-foreground transition-gentle hover:text-primary md:text-xl"
          >
            Hehe<span className="dot-accent">.</span>
          </Link>

          {/* ── Desktop: the nav is set, not decorated ── */}
          <div className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={`${MASTHEAD_LINK} ${
                    item.accent ? "inline-flex items-center gap-2 !text-rose hover:!text-rose" : ""
                  }`}
                  activeClassName="!text-foreground"
                >
                  {/* The masthead is words only; the pairing prompt is the sole
                      entry that carries a mark, which is what sets it apart
                      without a pill or a dot the rest of the row would answer. */}
                  {item.accent && <Icon className="h-4 w-4" aria-hidden />}
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
                  Hehe<span className="dot-accent">.</span>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Every page on the site
                </SheetDescription>

                <ul className="mt-8 divide-y divide-border border-y border-border">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    // Profile is three destinations wearing one route, so in the
                    // sheet it becomes a labelled group rather than a link that
                    // silently drops you on whichever panel it feels like.
                    if (item.path === "/trainer-card" && !item.accent) {
                      return (
                        <li key={item.label}>
                          {/* Native <details> — the disclosure the platform already
                              ships, keyboard and a11y included. Open by default
                              while you're on the page it points at. */}
                          <details
                            open={profileOpen}
                            onToggle={(e) => setProfileOpen(e.currentTarget.open)}
                            className="group"
                          >
                            <summary
                              className={`flex cursor-pointer list-none items-center gap-3 py-4 font-serif text-xl transition-gentle hover:text-foreground [&::-webkit-details-marker]:hidden ${
                                isActive ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              <Icon
                                className={`h-4 w-4 ${
                                  isActive ? "text-rose" : "text-muted-foreground"
                                }`}
                              />
                              {item.label}
                              <ChevronDown
                                className="ml-auto h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                                aria-hidden
                              />
                            </summary>
                            <ul className="mb-4 ml-2 border-l border-border pl-5">
                              {PROFILE_TABS.map((sub) => {
                                const SubIcon = sub.icon;
                                const subActive =
                                  location.pathname === "/trainer-card" &&
                                  activeProfileTab === sub.tab;
                                return (
                                  <li key={sub.tab}>
                                    <SheetClose asChild>
                                      <Link
                                        to={
                                          sub.tab === "card"
                                            ? "/trainer-card"
                                            : `/trainer-card?tab=${sub.tab}`
                                        }
                                        aria-current={subActive ? "page" : undefined}
                                        className={`flex items-center gap-3 py-3 font-serif text-lg transition-gentle hover:text-foreground ${
                                          subActive ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                      >
                                        <SubIcon
                                          className={`h-4 w-4 ${
                                            subActive ? "text-rose" : "text-muted-foreground"
                                          }`}
                                        />
                                        {sub.label}
                                      </Link>
                                    </SheetClose>
                                  </li>
                                );
                              })}
                            </ul>
                          </details>
                        </li>
                      );
                    }

                    return (
                      <li key={item.label}>
                        <SheetClose asChild>
                          <NavLink
                            to={item.path}
                            className={`flex items-center gap-3 py-4 font-serif text-xl transition-gentle hover:text-foreground ${
                              item.accent ? "text-rose" : "text-muted-foreground"
                            }`}
                            activeClassName="!text-foreground"
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                item.accent || isActive ? "text-rose" : "text-muted-foreground"
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
