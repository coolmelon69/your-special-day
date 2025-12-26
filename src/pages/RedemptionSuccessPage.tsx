import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import confetti from "canvas-confetti";
import { Helmet } from "react-helmet-async";

const RedemptionSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const couponTitle = (location.state as { couponTitle?: string })?.couponTitle;
  const [backgroundGradient, setBackgroundGradient] = useState<string>(
    "from-green-400 via-green-300 to-white"
  );

  useEffect(() => {
    // Redirect if no coupon title
    if (!couponTitle) {
      navigate("/coupons");
      return;
    }

    // Trigger confetti on mount
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Fire from center with spread
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Initial explosion
    confetti({
      ...defaults,
      particleCount: 100,
      origin: { x: 0.5, y: 0.5 },
    });

    // Play success sound
    try {
      const audio = new Audio("/sounds/success.mp3");
      audio.volume = 0.7;
      audio.play().catch((error) => {
        console.debug("Could not play success sound:", error);
      });
    } catch (error) {
      console.debug("Could not create audio object:", error);
    }

    // Fade background gradient after initial flash
    setTimeout(() => {
      setBackgroundGradient("from-white to-white");
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [couponTitle, navigate]);

  const handleBackToWallet = () => {
    navigate("/coupons");
  };

  if (!couponTitle) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>Redemption Successful - Your Special Day</title>
      </Helmet>
      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-b ${backgroundGradient} transition-all duration-500 px-4`}
      >
        {/* Checkmark Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 10,
            duration: 0.8,
          }}
          className="mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-50" />
            <div className="relative bg-green-500 rounded-full p-6 md:p-8">
              <Check className="w-24 h-24 md:w-32 md:h-32 text-white stroke-[4]" />
            </div>
          </div>
        </motion.div>

        {/* Success Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mb-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            SUCCESS!
          </h1>
          <p className="text-xl md:text-2xl text-gray-700">
            You have redeemed:
          </p>
          <p className="text-2xl md:text-3xl font-semibold text-gray-900 mt-2">
            {couponTitle}
          </p>
        </motion.div>

        {/* Back to Wallet Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          onClick={handleBackToWallet}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Wallet
        </motion.button>
      </div>
    </>
  );
};

export default RedemptionSuccessPage;

