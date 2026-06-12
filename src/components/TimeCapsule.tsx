import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

const STORAGE_KEY_MESSAGE = "time-capsule-message";
const STORAGE_KEY_LOCKED = "time-capsule-locked";
const STORAGE_KEY_UNLOCK_DATE = "time-capsule-unlock-date";

const DEFAULT_MESSAGE = `My Dearest Love,

This is a time capsule letter that will unlock on our special date.

When you read this, I hope it brings back all the beautiful memories we've shared together. Every moment with you has been a gift, and I wanted to capture these feelings in a letter that would wait for the perfect moment to be revealed.

Write your heartfelt message here, then lock it to unlock on February 12th next year.

With all my love,
Your Partner ♡`;

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
      if (saved) return new Date(saved);
    }
    return getNextFeb12();
  });

  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState<CountdownValues>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_MESSAGE, message);
    }
  }, [message]);

  const handleLock = () => {
    const nextFeb12 = getNextFeb12();
    setIsLocked(true);
    setUnlockDate(nextFeb12);
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_LOCKED, "true");
      localStorage.setItem(STORAGE_KEY_UNLOCK_DATE, nextFeb12.toISOString());
    }
  };

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
        if (isLocked && currentTime >= unlockDate) {
          setIsLocked(false);
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem(STORAGE_KEY_LOCKED, "false");
          }
        }
      }
    };

    updateCountdown();
    if (isLocked) {
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [isLocked, unlockDate]);

  return (
    <section className="py-20 md:py-32 bg-background">
      <div className="container px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="font-mono-caption text-primary/70 mb-4">sealed with love</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-4">
            Time <span className="text-gradient-romantic">Capsule</span>
          </h2>
          <p className="font-sans font-light text-muted-foreground text-lg max-w-md mx-auto">
            A letter waiting for the perfect moment to be revealed
          </p>
        </motion.div>

        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {/* Envelope card */}
          <div className="relative bg-card border border-border rounded-2xl shadow-lavender overflow-hidden">

            {/* Envelope flap (decorative top) */}
            <div
              className="h-2 w-full"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--periwinkle)) 100%)",
              }}
            />

            {/* Letter header */}
            <div className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-border bg-accent/30">
              <div className="flex items-center gap-3">
                {/* Periwinkle wax seal */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--periwinkle)) 0%, hsl(var(--primary)) 100%)",
                  }}
                >
                  {isCurrentlyLocked ? (
                    <Lock size={14} className="text-white" />
                  ) : (
                    <Unlock size={14} className="text-white" />
                  )}
                </div>
                <div>
                  <p className="font-mono-caption text-primary/70">
                    {isCurrentlyLocked ? "sealed · locked" : isLocked ? "unsealed · revealed" : "compose letter"}
                  </p>
                  <p className="font-serif text-base font-medium text-foreground">
                    {isCurrentlyLocked
                      ? `Unlocks February 12th`
                      : isLocked
                      ? "Your letter is revealed ♡"
                      : "Write your message"}
                  </p>
                </div>
              </div>

              {/* Periwinkle stamp mark */}
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center opacity-30 select-none"
                style={{ borderColor: "hsl(var(--periwinkle))", color: "hsl(var(--periwinkle))" }}
              >
                <span className="font-script text-xs leading-none text-center">♡</span>
              </div>
            </div>

            {/* Letter body */}
            <div className="relative px-6 md:px-10 py-8 md:py-12 min-h-[420px]">
              {/* Paper texture lines */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, hsl(var(--primary)) 28px)",
                  backgroundSize: "100% 28px",
                }}
              />

              {/* Write mode */}
              {!isLocked ? (
                <motion.div
                  className="relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full min-h-[320px] bg-transparent border-none outline-none font-serif text-lg md:text-xl leading-[28px] text-foreground/90 resize-none placeholder:text-muted-foreground/50"
                    placeholder={DEFAULT_MESSAGE}
                    style={{ lineHeight: "28px" }}
                  />
                  <div className="mt-6 pt-6 border-t border-border flex flex-col sm:flex-row items-center gap-4">
                    <motion.button
                      onClick={handleLock}
                      disabled={!message.trim()}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-sans font-medium text-sm shadow-romantic hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={message.trim() ? { y: -2 } : {}}
                      whileTap={message.trim() ? { scale: 0.98 } : {}}
                    >
                      <Lock size={14} />
                      Seal the Letter
                    </motion.button>
                    <p className="font-sans font-light text-xs text-muted-foreground text-center sm:text-left">
                      Locks until February 12th next year
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="relative z-10"
                  animate={{
                    filter: isCurrentlyLocked ? "blur(20px)" : "blur(0px)",
                    opacity: isCurrentlyLocked ? 0.4 : 1,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                >
                  <p className="font-serif text-lg md:text-xl leading-[28px] text-foreground/90 whitespace-pre-line">
                    {message}
                  </p>
                </motion.div>
              )}

              {/* Lock overlay */}
              <AnimatePresence>
                {isCurrentlyLocked && (
                  <motion.div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl"
                    style={{ background: "hsl(var(--card) / 0.85)", backdropFilter: "blur(8px)" }}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                  >
                    {/* Periwinkle seal */}
                    <motion.div
                      className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-glow"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--periwinkle)) 0%, hsl(var(--primary)) 100%)",
                      }}
                      initial={{ scale: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    >
                      <Lock size={28} className="text-white" />
                    </motion.div>

                    {/* Countdown */}
                    <motion.div
                      className="text-center mb-6"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-end justify-center gap-3 md:gap-5 mb-3">
                        {[
                          { val: countdown.days, label: "Days" },
                          { val: String(countdown.hours).padStart(2, "0"), label: "Hours" },
                          { val: String(countdown.minutes).padStart(2, "0"), label: "Mins" },
                          { val: String(countdown.seconds).padStart(2, "0"), label: "Secs" },
                        ].map((item, i) => (
                          <div key={i} className="flex flex-col items-center">
                            <span className="font-serif text-3xl md:text-4xl font-semibold text-gradient-romantic">
                              {item.val}
                            </span>
                            <span className="font-mono-caption text-muted-foreground mt-1">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border font-sans text-sm font-medium"
                      style={{
                        background: "hsl(var(--periwinkle-light))",
                        borderColor: "hsl(var(--periwinkle) / 0.3)",
                        color: "hsl(var(--periwinkle))",
                      }}
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Lock size={12} />
                      Sealed until February 12th
                    </motion.div>
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
