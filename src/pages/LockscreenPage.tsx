import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { unlockSite } from "@/utils/adminAuth";

const LockscreenPage = ({ onUnlock }: { onUnlock: () => void }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 250));

    if (unlockSite(password)) {
      onUnlock();
    } else {
      setError(true);
      setPassword("");
    }
    setIsLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Private</title>
      </Helmet>
      <main className="min-h-screen flex items-center justify-center bg-background px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xs"
        >
          <Lock className="w-5 h-5 text-muted-foreground mb-5" strokeWidth={1.5} />

          <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-2 tracking-tight">
            Not yet.
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            This one's private. Enter the password, or head to the cafes.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <motion.input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              animate={error ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-transparent border-0 border-b border-border pb-3 text-lg text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-foreground transition-colors"
            />
            {error && (
              <p className="mt-2 text-xs text-destructive">Wrong password.</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="mt-8 w-full py-3 text-sm font-medium bg-primary text-primary-foreground rounded-full transition hover:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Checking…" : "Enter"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/cafes")}
            className="mt-6 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Browse cafes instead
          </button>
        </motion.div>
      </main>
    </>
  );
};

export default LockscreenPage;
