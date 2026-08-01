import { motion } from "framer-motion";
import { Eyebrow } from "@/components/editorial";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-accent/30">
      {/* Extra bottom room so the fixed camera button never lands on the colophon. */}
      <div className="container px-6 pb-28 pt-14 md:pt-16">
        <motion.div
          className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <Eyebrow>Colophon</Eyebrow>
            <p className="display mt-4 max-w-[26ch] font-serif text-2xl leading-snug text-foreground md:text-3xl">
              Made by hand, over more nights than I'll admit, for <em>Mochi</em>
              <span className="dot-accent">.</span>
            </p>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground md:text-right">
            <p>Built by Melon</p>
            <p>Set in Cormorant Garamond &amp; DM Sans</p>
            <p>{year} · no rights reserved, all of it yours</p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
