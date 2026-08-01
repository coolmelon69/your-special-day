import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AdventureProvider } from "@/contexts/AdventureContext";
import NavigationBar from "@/components/NavigationBar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";
import HomePage from "./pages/HomePage";
import StampsPage from "./pages/StampsPage";
import CouponsPage from "./pages/CouponsPage";
import MemoryBookPage from "./pages/MemoryBookPage";
import WrappedPage from "./pages/WrappedPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ScanQRPage from "./pages/ScanQRPage";
import RedemptionSuccessPage from "./pages/RedemptionSuccessPage";
import NotFound from "./pages/NotFound";
import CameraPage from "./pages/CameraPage";
import CafesPage from "./pages/CafesPage";
import CafeCategoryPage from "./pages/CafeCategoryPage";
import LockscreenPage from "./pages/LockscreenPage";
import { isSiteUnlocked } from "@/utils/adminAuth";


const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -10 },
};

const pageTransition = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial="initial"
    animate="animate"
    exit="exit"
    variants={pageVariants}
    transition={pageTransition}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/stamps" element={<PageWrapper><StampsPage /></PageWrapper>} />
        <Route path="/coupons" element={<PageWrapper><CouponsPage /></PageWrapper>} />
        <Route path="/memory-book" element={<PageWrapper><MemoryBookPage /></PageWrapper>} />
        <Route path="/wrapped" element={<PageWrapper><WrappedPage /></PageWrapper>} />
        <Route path="/reset-password" element={<PageWrapper><ResetPasswordPage /></PageWrapper>} />
        <Route path="/admin/login" element={<PageWrapper><AdminLoginPage /></PageWrapper>} />
        <Route path="/admin" element={<PageWrapper><AdminPanelPage /></PageWrapper>} />
        <Route path="/scan-qr" element={<PageWrapper><ScanQRPage /></PageWrapper>} />
        <Route path="/redemption-success" element={<PageWrapper><RedemptionSuccessPage /></PageWrapper>} />
        <Route path="/camera" element={<PageWrapper><CameraPage /></PageWrapper>} />
        <Route path="/cafes" element={<PageWrapper><CafesPage /></PageWrapper>} />
        <Route path="/cafes/:slug" element={<PageWrapper><CafeCategoryPage /></PageWrapper>} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const SiteGate = () => {
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(isSiteUnlocked());
  const isPublicPath =
    location.pathname === "/cafes" || location.pathname.startsWith("/cafes/");

  if (!isPublicPath && !unlocked) {
    return <LockscreenPage onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <AdventureProvider>
      <ErrorBoundary>
        <NavigationBar />
        <AnimatedRoutes />
      </ErrorBoundary>
    </AdventureProvider>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <SiteGate />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
