import { motion } from "framer-motion";
import { useMemo } from "react";
import { Eyebrow } from "@/components/editorial";
import WrappedSlide from "../WrappedSlide";

const promises = [
  "1. lessen ragebaitingg 😇",
  "2. Adapt to the increase of difficulty",
  "3. Love you even more.",
  "4. More money.",
  "5. become non celen",
];

const TORN_EDGE =
  "polygon(0 0, 100% 0, 100% calc(100% - 14px), 95% 100%, 90% calc(100% - 14px), 85% 100%, 80% calc(100% - 14px), 75% 100%, 70% calc(100% - 14px), 65% 100%, 60% calc(100% - 14px), 55% 100%, 50% calc(100% - 14px), 45% 100%, 40% calc(100% - 14px), 35% 100%, 30% calc(100% - 14px), 25% 100%, 20% calc(100% - 14px), 15% 100%, 10% calc(100% - 14px), 5% 100%, 0 calc(100% - 14px))";

const NextYearPromiseSlide = () => {
  // Stable barcode — generated once, not re-randomized on every render.
  const bars = useMemo(
    () =>
      Array.from({ length: 22 }).map(() => ({
        width: Math.random() * 3 + 1,
        filled: Math.random() > 0.3,
      })),
    []
  );

  return (
    <WrappedSlide tone="lavender" glyphs={false}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <Eyebrow no="Nº 11" className="justify-center">
          The fine print
        </Eyebrow>
      </motion.div>

      {/* Receipt */}
      <motion.div
        className="relative font-mono text-left"
        initial={{ opacity: 0, scale: 0.95, y: 20, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, y: 0, rotate: -2 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{
          maxWidth: "360px",
          width: "100%",
          background: "hsl(270 30% 98%)",
          color: "hsl(var(--foreground))",
          padding: "1.75rem 1.75rem 2.25rem",
          fontSize: "0.85rem",
          lineHeight: 1.6,
          clipPath: TORN_EDGE,
          boxShadow: "0 14px 40px -12px hsl(var(--primary) / 0.3), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* paper grain */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
          }}
        />

        {/* rose ink stamp */}
        <motion.div
          className="stamp-ink-texture absolute -top-3 -right-2 z-20 grid place-items-center rounded-full border-2 border-rose text-rose"
          style={{ width: 78, height: 78, transform: "rotate(12deg)" }}
          initial={{ scale: 2.4, opacity: 0, rotate: 40 }}
          animate={{ scale: 1, opacity: 1, rotate: 12 }}
          transition={{ duration: 0.5, delay: 1.4, ease: "easeOut" }}
        >
          <span className="text-[9px] uppercase tracking-[0.12em] text-center leading-tight font-bold">
            Paid in
            <br />
            full ♥
          </span>
        </motion.div>

        <div className="relative z-10">
          {/* header */}
          <div className="text-center pb-3 mb-3" style={{ borderBottom: "1px dashed hsl(var(--border))" }}>
            <div className="font-bold tracking-[0.18em] text-base">MY PROMISES</div>
            <div className="text-[0.72rem] tracking-[0.1em] text-muted-foreground mt-1">
              EST. {new Date().getFullYear()}
            </div>
          </div>

          {/* items */}
          <div className="mb-3">
            {promises.map((promise, index) => (
              <motion.div
                key={index}
                className="mb-1.5"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.14 }}
              >
                {promise}
              </motion.div>
            ))}
          </div>

          {/* totals */}
          <div style={{ borderTop: "2px solid hsl(var(--foreground))" }} className="pt-2 mb-3 space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>PROMISES MADE</span>
              <span>{promises.length}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>FOR THE YEAR</span>
              <span>{new Date().getFullYear() + 1}</span>
            </div>
          </div>

          {/* thanks */}
          <div className="text-center text-[0.72rem] tracking-[0.14em] text-muted-foreground mb-3">
            THANK YOU FOR BEING YOU
          </div>

          {/* barcode */}
          <motion.div
            className="flex justify-center items-end gap-0 h-9 mx-auto"
            style={{ maxWidth: 240 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.2 }}
          >
            {bars.map((bar, i) => (
              <div
                key={i}
                style={{
                  width: `${bar.width}px`,
                  height: "100%",
                  background: bar.filled ? "hsl(var(--foreground))" : "transparent",
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </WrappedSlide>
  );
};

export default NextYearPromiseSlide;
