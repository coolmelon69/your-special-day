import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, UserPlus, LogIn, KeyRound } from "lucide-react";
import { signUp, signIn, resetPassword, type SignUpResult, type SignInResult } from "@/utils/auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "register" | "forgot-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleTabChange = (tab: "login" | "register" | "forgot-password") => {
    setActiveTab(tab);
    setError(null);
    setSuccessMessage(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const result = await resetPassword(email.trim());
      
      if (result.error) {
        setError(result.error.message || "Failed to send reset email. Please try again.");
      } else {
        // Success - show success message
        setSuccessMessage("Password reset email sent! Check your inbox for instructions.");
        setEmail("");
      }
    } catch (err: unknown) {
      console.error("Error sending reset email:", err);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const result: SignUpResult = await signUp(email.trim(), password);
      
      if (result.error) {
        setError(result.error.message || "Failed to register. Please try again.");
      } else if (result.user) {
        // Success - close modal and trigger callback
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError(null);
        onSuccess?.();
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      console.error("Error registering:", err);
      setError("Failed to register. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const result: SignInResult = await signIn(email.trim(), password);
      
      if (result.error) {
        setError(result.error.message || "Invalid email or password");
      } else if (result.user) {
        // Success - close modal and trigger callback
        setEmail("");
        setPassword("");
        setError(null);
        onSuccess?.();
        setTimeout(() => {
          onClose();
        }, 500);
      }
    } catch (err: unknown) {
      console.error("Error logging in:", err);
      setError("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render modal using portal to escape fixed parent
  if (!isOpen) return null;

  // Shared editorial field styles
  const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block";
  const inputClass =
    "w-full pl-10 pr-4 py-3 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground";
  const submitClass =
    "w-full py-3 px-4 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const linkClass =
    "w-full text-center text-xs text-primary hover:underline transition-colors";

  const modalContent = (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop - Dimmed background */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal - Centered using flex container */}
        <motion.div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl p-6 md:p-7 z-10 mx-auto shadow-romantic"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <div className="w-10 h-10 grid place-items-center rounded-xl border border-border text-primary mb-4">
              {activeTab === "login" ? (
                <LogIn className="w-5 h-5" />
              ) : activeTab === "register" ? (
                <UserPlus className="w-5 h-5" />
              ) : (
                <KeyRound className="w-5 h-5" />
              )}
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1.5">
              {activeTab === "login" ? "Welcome back" : activeTab === "register" ? "Create account" : "Reset password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeTab === "login"
                ? "Sign in to sync your progress."
                : activeTab === "register"
                ? "Create an account to get started."
                : "Enter your email to receive a password reset link."}
            </p>
          </div>

          {/* Tabs - Only show when not in forgot password mode */}
          {activeTab !== "forgot-password" && (
            <div className="flex gap-1 mb-5 rounded-[10px] border border-border bg-muted/40 p-1">
              <button
                onClick={() => handleTabChange("login")}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  activeTab === "login"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => handleTabChange("register")}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                  activeTab === "register"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Register
              </button>
            </div>
          )}

          {/* Success message */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
            >
              <p className="text-sm text-green-600 text-center">{successMessage}</p>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30"
            >
              <p className="text-sm text-destructive text-center">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className={inputIconClass} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="your@email.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={submitClass}>
                <LogIn className="w-4 h-4" />
                {isLoading ? "Logging in…" : "Login"}
              </button>

              {/* Forgot Password Link */}
              <button
                type="button"
                onClick={() => handleTabChange("forgot-password")}
                className={linkClass}
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className={inputIconClass} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="your@email.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="At least 6 characters"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Confirm Password</label>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Confirm your password"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={submitClass}>
                <UserPlus className="w-4 h-4" />
                {isLoading ? "Registering…" : "Register"}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {activeTab === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className={labelClass}>Email</label>
                <div className="relative">
                  <Mail className={inputIconClass} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="your@email.com"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className={submitClass}>
                <KeyRound className="w-4 h-4" />
                {isLoading ? "Sending…" : "Send Reset Link"}
              </button>

              {/* Back to Login Link */}
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className={linkClass}
              >
                Back to Login
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
};

export default AuthModal;



