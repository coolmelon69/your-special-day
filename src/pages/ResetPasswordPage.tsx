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
    } catch (err: unknown) {
      console.error("Error updating password:", err);
      setError("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Shared editorial styles
  const pageWrap = "flex min-h-screen items-center justify-center bg-background px-4";
  const cardClass = "max-w-md w-full bg-card border border-border rounded-2xl p-7 shadow-romantic";
  const labelClass = "text-xs font-medium text-muted-foreground mb-1.5 block";
  const inputClass =
    "w-full pl-10 pr-10 py-3 text-sm rounded-[10px] border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
  const inputIconClass = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground";
  const submitClass =
    "w-full py-3 px-4 text-sm font-medium rounded-[10px] bg-primary text-primary-foreground transition-all hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <>
        <Helmet>
          <title>Reset Password - Your Special Day</title>
        </Helmet>
        <div className={pageWrap}>
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <KeyRound className="w-10 h-10 mx-auto mb-4 text-primary animate-pulse" />
              <p className="font-mono text-sm uppercase tracking-wide text-muted-foreground">
                Verifying reset link…
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
        <div className={pageWrap}>
          <motion.div
            className={`${cardClass} text-center`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-10 h-10 grid place-items-center rounded-xl border border-destructive/30 text-destructive mx-auto mb-4">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              Invalid reset link
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center justify-center rounded-[10px] bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-95"
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
        <div className={pageWrap}>
          <motion.div
            className={`${cardClass} text-center`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="w-10 h-10 grid place-items-center rounded-xl border border-green-500/30 text-green-600 mx-auto mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">
              Password reset
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              Your password has been updated. Redirecting to home…
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
      <div className={`${pageWrap} py-12`}>
        <motion.div
          className={cardClass}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="w-10 h-10 grid place-items-center rounded-xl border border-border text-primary mb-4">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1.5">
              Reset password
            </h1>
            <p className="text-sm text-muted-foreground">Enter your new password below.</p>
          </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>New Password</label>
              <div className="relative">
                <Lock className={inputIconClass} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="At least 6 characters"
                  className={inputClass}
                  required
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

            <div>
              <label className={labelClass}>Confirm Password</label>
              <div className="relative">
                <Lock className={inputIconClass} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Confirm your password"
                  className={inputClass}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className={submitClass}>
              <KeyRound className="w-4 h-4" />
              {isLoading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
