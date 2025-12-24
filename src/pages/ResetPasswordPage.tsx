import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import { updatePassword, getCurrentSession } from "@/utils/auth";
import { supabase } from "@/utils/supabaseClient";

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have a valid recovery token
  useEffect(() => {
    const checkToken = async () => {
      // Supabase includes the token in the URL hash fragment
      // Format: #access_token=...&type=recovery&expires_in=...
      const hash = location.hash;
      const hasRecoveryToken = hash.includes("type=recovery") && hash.includes("access_token");
      
      if (hasRecoveryToken && supabase) {
        try {
          // Extract tokens from hash
          const hashParams = new URLSearchParams(hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");
          
          if (accessToken && refreshToken) {
            // Set the session manually since detectSessionInUrl is false
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (error) {
              console.error("Error setting session:", error);
              setIsValidToken(false);
              return;
            }
            
            if (data.session) {
              setIsValidToken(true);
              // Clear the hash from URL
              window.history.replaceState(null, "", location.pathname);
              return;
            }
          } else if (accessToken) {
            // If we only have access_token, still allow user to proceed
            // The updatePassword call will validate if the session is valid
            setIsValidToken(true);
            // Clear the hash from URL
            window.history.replaceState(null, "", location.pathname);
            return;
          }
        } catch (err) {
          console.error("Error processing recovery token:", err);
        }
      }
      
      // Check if we already have a session
      const session = await getCurrentSession();
      if (session) {
        setIsValidToken(true);
        return;
      }
      
      // If no token in hash and no session, wait a bit and check again
      setTimeout(async () => {
        const delayedSession = await getCurrentSession();
        if (delayedSession) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      }, 1000);
    };

    checkToken();
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(newPassword.trim());

      if (result.error) {
        setError(result.error.message || "Failed to update password. The link may have expired.");
      } else {
        setSuccess(true);
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err: any) {
      console.error("Error updating password:", err);
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <>
        <Helmet>
          <title>Reset Password - Your Special Day</title>
        </Helmet>
        <div className="flex min-h-screen items-center justify-center bg-[hsl(35_40%_90%)] px-4">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <KeyRound className="w-12 h-12 mx-auto mb-4 text-[hsl(15_70%_55%)] animate-pulse" />
              <p
                className="font-pixel text-sm text-[hsl(15_60%_35%)]"
                style={{ textRendering: "optimizeSpeed" }}
              >
                Verifying reset link...
              </p>
            </motion.div>
          </div>
        </div>
      </>
    );
  }

  // Show error if token is invalid
  if (isValidToken === false) {
    return (
      <>
        <Helmet>
          <title>Invalid Reset Link - Your Special Day</title>
        </Helmet>
        <div className="flex min-h-screen items-center justify-center bg-[hsl(35_40%_90%)] px-4">
          <motion.div
            className="max-w-md w-full bg-[hsl(35_40%_90%)] border-4 border-[hsl(15_60%_50%)] rounded-lg p-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ imageRendering: "pixelated" }}
          >
            <KeyRound className="w-12 h-12 mx-auto mb-4 text-[hsl(0_70%_50%)]" />
            <h1
              className="font-pixel text-xl md:text-2xl text-[hsl(15_70%_40%)] mb-2"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
              }}
            >
              Invalid Reset Link
            </h1>
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-4"
              style={{ textRendering: "optimizeSpeed" }}
            >
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={() => navigate("/")}
              className="font-pixel text-sm bg-[hsl(15_70%_55%)] border-2 border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all px-4 py-2 rounded"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Go to Home
            </button>
          </motion.div>
        </div>
      </>
    );
  }

  // Show success message
  if (success) {
    return (
      <>
        <Helmet>
          <title>Password Reset Success - Your Special Day</title>
        </Helmet>
        <div className="flex min-h-screen items-center justify-center bg-[hsl(35_40%_90%)] px-4">
          <motion.div
            className="max-w-md w-full bg-[hsl(35_40%_90%)] border-4 border-[hsl(15_60%_50%)] rounded-lg p-6 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ imageRendering: "pixelated" }}
          >
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-[hsl(120_70%_50%)]" />
            <h1
              className="font-pixel text-xl md:text-2xl text-[hsl(15_70%_40%)] mb-2"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
              }}
            >
              Password Reset Successful!
            </h1>
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-4"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Your password has been updated. Redirecting to home...
            </p>
          </motion.div>
        </div>
      </>
    );
  }

  // Show reset password form
  return (
    <>
      <Helmet>
        <title>Reset Password - Your Special Day</title>
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-[hsl(35_40%_90%)] px-4 py-12">
        <motion.div
          className="max-w-md w-full bg-[hsl(35_40%_90%)] border-4 border-[hsl(15_60%_50%)] rounded-lg p-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ imageRendering: "pixelated" }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <KeyRound className="w-8 h-8 mx-auto mb-2 text-[hsl(15_70%_55%)]" />
            <h1
              className="font-pixel text-xl md:text-2xl text-[hsl(15_70%_40%)] mb-2"
              style={{
                textRendering: "optimizeSpeed",
                WebkitFontSmoothing: "none",
                MozOsxFontSmoothing: "unset",
                fontSmooth: "never",
              }}
            >
              Reset Password
            </h1>
            <p
              className="font-pixel text-xs text-[hsl(15_60%_35%)]"
              style={{ textRendering: "optimizeSpeed" }}
            >
              Enter your new password below
            </p>
          </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="font-pixel text-xs text-[hsl(15_60%_35%)] mb-2 block"
                style={{ textRendering: "optimizeSpeed" }}
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(15_60%_35%)]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                  style={{
                    textRendering: "optimizeSpeed",
                    imageRendering: "pixelated",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(15_60%_35%)] hover:text-[hsl(15_70%_50%)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
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
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-10 py-3 font-pixel text-sm border-4 border-[hsl(30_40%_60%)] bg-white text-[hsl(15_70%_40%)] focus:outline-none focus:border-[hsl(15_60%_50%)]"
                  style={{
                    textRendering: "optimizeSpeed",
                    imageRendering: "pixelated",
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(15_60%_35%)] hover:text-[hsl(15_70%_50%)] transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 font-pixel text-sm bg-[hsl(15_70%_55%)] border-2 border-[hsl(15_60%_45%)] text-white hover:bg-[hsl(15_70%_60%)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ textRendering: "optimizeSpeed" }}
            >
              <KeyRound className="w-4 h-4" />
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
