import { Helmet } from "react-helmet-async";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Settings, CheckSquare, Gift, LogOut, Shield, Sparkles } from "lucide-react";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import StampsManager from "@/components/admin/StampsManager";
import CouponsManager from "@/components/admin/CouponsManager";
import AdminSettings from "@/components/admin/AdminSettings";
import WrappedSlidesManager from "@/components/admin/WrappedSlidesManager";
import WrappedTemplateEditor from "@/components/admin/WrappedTemplateEditor";
import { DisplayHeading } from "@/components/editorial";
import { logout } from "@/utils/adminAuth";

type Tab = "stamps" | "coupons" | "wrapped" | "settings";

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
    { id: "wrapped", label: "Wrapped", icon: Sparkles },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <ProtectedRoute>
      <Helmet>
        <title>Admin Panel - Your Special Day</title>
      </Helmet>
      <main className="min-h-screen bg-background pt-16 md:pt-20 pb-20">
        <div className="container px-4 md:px-6 py-8 max-w-3xl">
          {/* Header */}
          <motion.div
            className="flex flex-col items-center text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-12 h-12 grid place-items-center rounded-xl border border-border text-primary mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <DisplayHeading as="h1" className="text-3xl md:text-4xl">Admin panel</DisplayHeading>
            <p className="text-muted-foreground mt-2">Manage custom stamps and coupons.</p>

            {/* Logout button */}
            <motion.button
              onClick={handleLogout}
              className="mt-5 inline-flex items-center gap-2 rounded-[10px] border border-destructive/30 text-destructive px-4 py-2 text-sm font-medium hover:bg-destructive/10 transition-all"
              whileTap={{ scale: 0.97 }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </motion.button>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 rounded-[10px] border border-border bg-muted/40 p-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="bg-card border border-border rounded-2xl p-5 md:p-7 shadow-romantic">
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
                {activeTab === "wrapped" && (
                  <div className="space-y-8">
                    <WrappedTemplateEditor />
                    <div className="border-t border-border pt-8">
                      <WrappedSlidesManager />
                    </div>
                  </div>
                )}
                {activeTab === "settings" && <AdminSettings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
};

export default AdminPanelPage;




