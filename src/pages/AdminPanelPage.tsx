import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Settings, CheckSquare, Gift, LogOut, Shield } from "lucide-react";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import StampsManager from "@/components/admin/StampsManager";
import CouponsManager from "@/components/admin/CouponsManager";
import AdminSettings from "@/components/admin/AdminSettings";
import { logout } from "@/utils/adminAuth";

type Tab = "stamps" | "coupons" | "settings";

const AdminPanelPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("stamps");
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "stamps", label: "Stamps", icon: CheckSquare },
    { id: "coupons", label: "Coupons", icon: Gift },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <ProtectedRoute>
      <Helmet>
        <title>Admin Panel - Your Special Day</title>
      </Helmet>
      <main className="min-h-screen bg-[hsl(35_40%_85%)] pt-16 md:pt-20 pb-20">
        <div className="container px-4 md:px-6 py-8">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-4 mb-4">
              <Shield className="mx-auto mb-2 text-[hsl(15_70%_40%)]" size={32} />
              <h1
                className="font-pixel text-xl md:text-2xl text-[hsl(15_70%_40%)] mb-2"
                style={{
                  textRendering: "optimizeSpeed",
                  WebkitFontSmoothing: "none",
                  MozOsxFontSmoothing: "unset",
                  fontSmooth: "never",
                  letterSpacing: "0.05em",
                }}
              >
                ADMIN PANEL
              </h1>
              <p
                className="font-pixel text-xs md:text-sm text-[hsl(15_60%_35%)]"
                style={{
                  textRendering: "optimizeSpeed",
                  WebkitFontSmoothing: "none",
                  MozOsxFontSmoothing: "unset",
                  fontSmooth: "never",
                }}
              >
                Manage custom stamps and coupons
              </p>
            </div>

            {/* Logout button */}
            <motion.button
              onClick={handleLogout}
              className="px-4 py-2 font-pixel text-xs md:text-sm rounded-lg border-2 bg-[hsl(0_60%_50%)] border-[hsl(0_50%_40%)] text-white hover:bg-[hsl(0_60%_60%)] transition-all flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </motion.div>

          {/* Tabs */}
          <div className="bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1 mb-6">
            <div className="border-2 border-[hsl(30_50%_60%)] p-2">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 font-pixel text-xs md:text-sm border-2 transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white"
                          : "bg-[hsl(35_30%_75%)] border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] hover:bg-[hsl(35_30%_80%)]"
                      }`}
                      whileHover={!isActive ? { scale: 1.05 } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1">
            <div className="border-2 border-[hsl(30_50%_60%)] p-4 md:p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === "stamps" && <StampsManager />}
                  {activeTab === "coupons" && <CouponsManager />}
                  {activeTab === "settings" && <AdminSettings />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default AdminPanelPage;
