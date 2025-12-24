import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

const STORAGE_KEY_MESSAGE = "time-capsule-message";
const STORAGE_KEY_LOCKED = "time-capsule-locked";
const STORAGE_KEY_UNLOCK_DATE = "time-capsule-unlock-date";

// Default placeholder message
const DEFAULT_MESSAGE = `My Dearest Love,

This is a time capsule letter that will unlock on our special date. 

When you read this, I hope it brings back all the beautiful memories we've shared together. Every moment with you has been a gift, and I wanted to capture these feelings in a letter that would wait for the perfect moment to be revealed.

Write your heartfelt message here, then lock it to unlock on February 12th next year.

With all my love,
Your Partner 💕`;

// Helper function to get February 12th of next year
const getNextFeb12 = (): Date => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  return new Date(`${nextYear}-02-12T00:00:00`);
};

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TimeCapsule = () => {
  // Load state from localStorage
  const [message, setMessage] = useState<string>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY_MESSAGE);
      return saved || DEFAULT_MESSAGE;
    }
    return DEFAULT_MESSAGE;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY_LOCKED);
      return saved === "true";
    }
    return false;
  });

  const [unlockDate, setUnlockDate] = useState<Date>(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY_UNLOCK_DATE);
      if (saved) {
        return new Date(saved);
      }
    }
    return getNextFeb12();
  });

  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState<CountdownValues>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Save message to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_MESSAGE, message);
    }
  }, [message]);

  // Handle locking the capsule
  const handleLock = () => {
    // For testing: unlock 10 seconds after locking
    const unlockIn10Seconds = new Date(Date.now() + 10000);
    setIsLocked(true);
    setUnlockDate(unlockIn10Seconds);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_LOCKED, "true");
      localStorage.setItem(STORAGE_KEY_UNLOCK_DATE, unlockIn10Seconds.toISOString());
    }
  };

  // Check if currently locked based on date
  const isCurrentlyLocked = isLocked && now < unlockDate;

  useEffect(() => {
    const updateCountdown = () => {
      const currentTime = new Date();
      setNow(currentTime);

      if (isLocked && currentTime < unlockDate) {
        const days = differenceInDays(unlockDate, currentTime);
        const totalHours = differenceInHours(unlockDate, currentTime);
        const totalMinutes = differenceInMinutes(unlockDate, currentTime);
        const totalSeconds = differenceInSeconds(unlockDate, currentTime);

        setCountdown({
          days,
          hours: totalHours % 24,
          minutes: totalMinutes % 60,
          seconds: totalSeconds % 60,
        });
      } else {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        // Auto-unlock when date is reached
        if (isLocked && currentTime >= unlockDate) {
          setIsLocked(false);
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(STORAGE_KEY_LOCKED, "false");
          }
        }
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second (only if locked)
    if (isLocked) {
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, unlockDate]);

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Time <span className="text-gradient-romantic">Capsule</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            A special message waiting to be revealed
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Frosted glass card container */}
          <div className="relative bg-card/80 backdrop-blur-lg rounded-3xl shadow-xl border-2 border-primary/20 overflow-hidden">
            {/* Background pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23f4a5b8' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
            />
            
            {/* Content wrapper with padding */}
            <div className="relative p-6 md:p-8 lg:p-12 min-h-[400px]">

            {/* Letter content - show editor when not locked, show message when unlocked */}
            {!isLocked ? (
              <motion.div
                className="relative z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Write your message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full min-h-[300px] p-4 bg-background/50 border-2 border-primary/20 rounded-xl font-serif text-lg md:text-xl leading-relaxed text-foreground/90 resize-none focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={DEFAULT_MESSAGE}
                  />
                </div>
                <motion.button
                  onClick={handleLock}
                  disabled={!message.trim()}
                  className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-sans font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: message.trim() ? 1.02 : 1 }}
                  whileTap={{ scale: message.trim() ? 0.98 : 1 }}
                >
                  <Lock className="w-5 h-5" />
                  Lock Time Capsule
                </motion.button>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Once locked, this message will unlock on February 12th next year
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="relative z-10"
                animate={{
                  filter: isCurrentlyLocked ? "blur(24px)" : "blur(0px)",
                  opacity: isCurrentlyLocked ? 0.5 : 1,
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <div className="font-serif text-lg md:text-xl leading-relaxed text-foreground/90 whitespace-pre-line">
                  {message}
                </div>
              </motion.div>
            )}

            {/* Lock overlay - only shown when locked and before unlock date */}
            <AnimatePresence>
              {isCurrentlyLocked && (
                <motion.div
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-3xl"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                >
                  <div className="w-full p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center">
                    {/* Lock icon */}
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <Lock className="w-16 h-16 md:w-20 md:h-20 text-primary mb-6" />
                    </motion.div>

                    {/* Countdown timer */}
                    <motion.div
                      className="text-center mb-6"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-center gap-2 md:gap-4 font-sans font-bold text-2xl md:text-3xl lg:text-4xl text-foreground">
                        <div className="flex flex-col items-center">
                          <span className="text-primary">{countdown.days}</span>
                          <span className="text-xs md:text-sm text-muted-foreground font-normal">
                            Days
                          </span>
                        </div>
                        <span className="text-muted-foreground">:</span>
                        <div className="flex flex-col items-center">
                          <span className="text-primary">{String(countdown.hours).padStart(2, "0")}</span>
                          <span className="text-xs md:text-sm text-muted-foreground font-normal">
                            Hours
                          </span>
                        </div>
                        <span className="text-muted-foreground">:</span>
                        <div className="flex flex-col items-center">
                          <span className="text-primary">{String(countdown.minutes).padStart(2, "0")}</span>
                          <span className="text-xs md:text-sm text-muted-foreground font-normal">
                            Mins
                          </span>
                        </div>
                        <span className="text-muted-foreground">:</span>
                        <div className="flex flex-col items-center">
                          <span className="text-primary">{String(countdown.seconds).padStart(2, "0")}</span>
                          <span className="text-xs md:text-sm text-muted-foreground font-normal">
                            Secs
                          </span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Badge */}
                    <motion.div
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/30"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="font-sans text-sm md:text-base text-primary font-medium">
                        Locked until February 12th next year
                      </span>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TimeCapsule;


