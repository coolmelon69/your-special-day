import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { Eyebrow, DisplayHeading, EditorialFigure, Pill } from "@/components/editorial";
import WrappedSlide from "../WrappedSlide";

const TheTurningPointSlide = () => {
  return (
    <WrappedSlide tone="lavender" glyphs={false} bare>
      <div className="relative z-10 h-full grid lg:grid-cols-[1fr_1.05fr] gap-8 lg:gap-16 items-center max-w-5xl mx-auto px-6 py-16">
        {/* Figure */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-sm mx-auto lg:mx-0"
        >
          <EditorialFigure
            src="/images/gallery/emart.webp"
            alt="Emart IOI Connezion"
            dotGrid="tl"
            aspectClassName="aspect-[4/5]"
            annotate={
              <>
                The spot
                <br />
                we got real
                <br />
                with each other.
              </>
            }
            caption="Emart IOI Connezion"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          className="text-center lg:text-left"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <div className="flex justify-center lg:justify-start">
            <Eyebrow no="Nº 02">The turning point</Eyebrow>
          </div>
          <DisplayHeading as="h2" className="mt-4">
            The spot where <em>everything</em> changed
            <span className="dot-accent">.</span>
          </DisplayHeading>
          <p className="text-lg text-muted-foreground max-w-[46ch] mt-5 mx-auto lg:mx-0">
            We talked about our feelings here for the very first time — and nothing
            was quite the same after.
          </p>
          <div className="flex justify-center lg:justify-start mt-6">
            <Pill variant="rose" icon={<MapPin />}>
              Where it shifted
            </Pill>
          </div>
        </motion.div>
      </div>
    </WrappedSlide>
  );
};

export default TheTurningPointSlide;
