import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { login, isAuthenticated } from "@/utils/adminAuth";

const AdminLoginPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      const from = (location.state as { from?: Location })?.from;
      navigate(from?.pathname || "/admin", { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate small delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (login(password)) {
      const from = (location.state as { from?: Location })?.from;
      navigate(from?.pathname || "/admin", { replace: true });
    } else {
      setError("Incorrect password. Please try again.");
      setPassword("");
    }
    setIsLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Admin Login - Your Special Day</title>
      </Helmet>
      <main className="min-h-screen flex items-center justify-center bg-[hsl(35_40%_85%)] pt-16 md:pt-20">
        <motion.div
          className="w-full max-w-md mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-[hsl(35_40%_85%)] border-4 border-[hsl(15_60%_50%)] p-1">
            <div className="border-2 border-[hsl(30_50%_60%)] p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <Lock className="mx-auto mb-4 text-[hsl(15_70%_40%)]" size={48} />
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
                  Enter password to continue
                </p>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-white flex-shrink-0" />
                  <p
                    className="font-pixel text-xs text-white"
                    style={{
                      textRendering: "optimizeSpeed",
                      WebkitFontSmoothing: "none",
                      MozOsxFontSmoothing: "unset",
                      fontSmooth: "never",
                    }}
                  >
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Login form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    className="block font-pixel text-xs text-[hsl(15_60%_35%)] mb-2"
                    style={{ textRendering: "optimizeSpeed" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 font-pixel text-sm bg-[hsl(35_30%_80%)] border-2 border-[hsl(30_40%_60%)] text-[hsl(15_60%_35%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                      placeholder="Enter admin password"
                      style={{ textRendering: "optimizeSpeed" }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(15_60%_35%)] hover:text-[hsl(15_70%_50%)] transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full px-6 py-3 font-pixel text-sm md:text-base rounded-lg border-2 bg-[hsl(15_70%_55%)] border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                  whileHover={!isLoading && password ? { scale: 1.05 } : {}}
                  whileTap={!isLoading && password ? { scale: 0.95 } : {}}
                >
                  {isLoading ? "Logging in..." : "Login"}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default AdminLoginPage;


