import { motion } from "framer-motion";
import { useEffect } from "react";
import { Heart } from "lucide-react";
import { celebrationConfetti } from "@/utils/particles";
import { Eyebrow, DisplayHeading, Pill } from "@/components/editorial";
import WrappedSlide from "../WrappedSlide";

const ItsOfficialSlide = () => {
  useEffect(() => {
    celebrationConfetti({ particleCount: 200, bursts: 6 });
  }, []);

  return (
    <WrappedSlide tone="rose">
      <motion.div
        className="max-w-2xl"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="flex justify-center">
          <Eyebrow no="Nº 04">The headline</Eyebrow>
        </div>

        <motion.p
          className="font-serif font-bold text-rose text-6xl sm:text-7xl md:text-8xl tracking-tight leading-none mt-5"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          May 1, 2026
        </motion.p>

        <DisplayHeading as="h2" className="mt-6">
          The day we made it <em>official</em>
          <span className="dot-accent">.</span>
        </DisplayHeading>

        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Pill variant="rose" icon={<Heart />}>
            Officially yours
          </Pill>
        </motion.div>
      </motion.div>
    </WrappedSlide>
  );
};

export default ItsOfficialSlide;
