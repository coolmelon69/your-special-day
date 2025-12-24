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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      console.error("Error logging in:", err);
      setError("Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render modal using portal to escape fixed parent
  if (!isOpen) return null;

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
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal - Centered using flex container */}
        <motion.div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-[hsl(35_40%_90%)] border-4 border-[hsl(15_60%_50%)] rounded-lg p-6 z-10 mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          style={{ imageRendering: "pixelated" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-[hsl(0_60%_50%)] border-2 border-[hsl(0_50%_40%)] hover:bg-[hsl(0_60%_60%)] transition-colors rounded"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            {activeTab === "login" ? (
              <LogIn className="w-8 h-8 mx-auto mb-2 text-[hsl(15_70%_55%)]" />
            ) : activeTab === "register" ? (
              <UserPlus className="w-8 h-8 mx-auto mb-2 text-[hsl(15_70%_55%)]" />
            ) : (
              <KeyRound className="w-8 h-8 mx-auto mb-2 text-[hsl(15_70%_55%)]" />
            )}
            <h2
              className="font-pixel text-xl md:text-2xl text-[hsl(15_70%_40%)] mb-2"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
              }}
            >
              {activeTab === "login" ? "Login" : activeTab === "register" ? "Register" : "Reset Password"}
            </h2>
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)]"
              style={{ textRendering: "optimizeSpeed" }}
            >
              {activeTab === "login"
                ? "Sign in to sync your progress"
                : activeTab === "register"
                ? "Create an account to get started"
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {/* Tabs - Only show when not in forgot password mode */}
          {activeTab !== "forgot-password" && (
            <div className="flex gap-2 mb-4 border-2 border-[hsl(30_40%_60%)] rounded p-1">
              <button
                onClick={() => handleTabChange("login")}
                className={`flex-1 py-2 px-4 font-pixel text-sm transition-all ${
                  activeTab === "login"
                    ? "bg-[hsl(15_70%_55%)] text-white"
                    : "bg-transparent text-[hsl(15_60%_35%)] hover:bg-[hsl(35_30%_85%)]"
                }`}
                style={{ textRendering: "optimizeSpeed" }}
              >
                Login
              </button>
              <button
                onClick={() => handleTabChange("register")}
                className={`flex-1 py-2 px-4 font-pixel text-sm transition-all ${
                  activeTab === "register"
                    ? "bg-[hsl(15_70%_55%)] text-white"
                    : "bg-transparent text-[hsl(15_60%_35%)] hover:bg-[hsl(35_30%_85%)]"
                }`}
                style={{ textRendering: "optimizeSpeed" }}
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
              className="mb-4 p-3 bg-[hsl(120_70%_50%)] border-2 border-[hsl(120_60%_40%)] rounded"
            >
              <p
                className="font-pixel text-xs text-white text-center"
                style={{ textRendering: "optimizeSpeed" }}
              >
                {successMessage}
              </p>
            </motion.div>
          )}

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-[hsl(0_70%_50%)] border-2 border-[hsl(0_60%_40%)] rounded"
            >
              <p
                className="font-pixel text-xs text-white text-center"
                style={{ textRendering: "optimizeSpeed" }}
              >
                {error}
              </p>
            </motion.div>
          )}

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      imageRendering: "pixelated",
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      imageRendering: "pixelated",
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 font-pixel text-sm bg-[hsl(15_70%_55%)] border-2 border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ textRendering: "optimizeSpeed" }}
              >
                <LogIn className="w-4 h-4" />
                {isLoading ? "Logging in..." : "Login"}
              </button>

              {/* Forgot Password Link */}
              <button
                type="button"
                onClick={() => handleTabChange("forgot-password")}
                className="w-full text-center font-pixel text-xs text-[hsl(15_60%_50%)] hover:text-[hsl(15_70%_55%)] transition-colors underline"
                style={{ textRendering: "optimizeSpeed" }}
              >
                Forgot password?
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label
                  className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      imageRendering: "pixelated",
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-4 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      imageRendering: "pixelated",
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError(null);
                    }}
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      imageRendering: "pixelated",
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 font-pixel text-sm bg-[hsl(15_70%_55%)] border-2 border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ textRendering: "optimizeSpeed" }}
              >
                <UserPlus className="w-4 h-4" />
                {isLoading ? "Registering..." : "Register"}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {activeTab === "forgot-password" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label
                  className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                  style={{ textRendering: "optimizeSpeed" }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-4 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                    style={{
                      textRendering: "optimizeSpeed",
                      imageRendering: "pixelated",
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 font-pixel text-sm bg-[hsl(15_70%_55%)] border-2 border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ textRendering: "optimizeSpeed" }}
              >
                <KeyRound className="w-4 h-4" />
                {isLoading ? "Sending..." : "Send Reset Link"}
              </button>

              {/* Back to Login Link */}
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className="w-full text-center font-pixel text-xs text-[hsl(15_60%_50%)] hover:text-[hsl(15_70%_55%)] transition-colors underline"
                style={{ textRendering: "optimizeSpeed" }}
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



