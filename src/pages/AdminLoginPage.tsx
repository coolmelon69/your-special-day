import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  login,
  isAuthenticated,
  currentPathname,
  ADMIN_LOGIN_PATH,
} from "@/utils/adminAuth";

const AdminLoginPage = () => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated. The guard reads the real address bar,
  // not `location.pathname`: AnimatePresence mode="wait" keeps this page mounted
  // through its exit animation, and `<Routes location=...>` pins its router
  // location to /admin/login the whole time. Checking the router location would
  // therefore always pass, re-firing the effect every render until the browser
  // throws "SecurityError: Attempt to use history.replaceState() more than 100
  // times" — after which it refuses the navigation that actually mattered.
  useEffect(() => {
    if (currentPathname() !== ADMIN_LOGIN_PATH) return;
    if (!isAuthenticated()) return;
    const from = (location.state as { from?: Location })?.from;
    navigate(from?.pathname || "/admin", { replace: true });
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
      <main className="min-h-screen flex items-center justify-center bg-background px-4 pt-16 md:pt-20">
        <motion.div
          className="w-full max-w-md mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card border border-border rounded-2xl p-7 shadow-romantic">
            {/* Header */}
            <div className="mb-6">
              <div className="w-10 h-10 grid place-items-center rounded-xl border border-border text-primary mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1.5">
                Admin panel
              </h1>
              <p className="text-sm text-muted-foreground">Enter password to continue.</p>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </motion.div>
            )}

            {/* Login form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
                    placeholder="Enter admin password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                className="w-full px-6 py-3 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                whileTap={!isLoading && password ? { scale: 0.97 } : {}}
              >
                {isLoading ? "Logging in…" : "Login"}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </main>
    </>
  );
};

export default AdminLoginPage;




