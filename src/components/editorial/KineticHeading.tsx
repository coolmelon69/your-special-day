import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

interface KineticHeadingProps {
  text?: string;
  children?: React.ReactNode;
  as?: "h1" | "h2";
  className?: string;
}

export default function KineticHeading({
  text,
  children,
  as: Tag = "h1",
  className,
}: KineticHeadingProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const childVariant = {
    hidden: { y: "100%" },
    visible: {
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 100 },
    },
  };

  const MotionTag = motion(Tag as keyof React.JSX.IntrinsicElements) as any;
  const baseClasses = cn(
    "display font-serif font-bold tracking-tight leading-[1.02] text-foreground flex flex-wrap items-end",
    Tag === "h1"
      ? "text-5xl md:text-6xl lg:text-7xl"
      : "text-3xl md:text-4xl lg:text-5xl",
    className
  );

  if (text) {
    const words = text.split(" ");
    return (
      <MotionTag
        className={baseClasses}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {words.map((word, i) => (
          <span
            key={i}
            className="inline-flex overflow-hidden mr-[0.25em] last:mr-0"
          >
            <motion.span variants={childVariant} className="inline-block">
              {word}
            </motion.span>
          </span>
        ))}
      </MotionTag>
    );
  }

  // Fallback for children to retain formatting like <em> etc.
  // It wraps top-level text nodes or elements in the kinetic animation.
  const arrayChildren = React.Children.toArray(children);
  return (
    <MotionTag
      className={baseClasses}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {arrayChildren.map((child, i) => {
        if (typeof child === "string") {
          return child.split(" ").map((word, j) => {
            if (!word.trim()) return <span key={`${i}-${j}`}>&nbsp;</span>;
            return (
              <span
                key={`${i}-${j}`}
                className="inline-flex overflow-hidden mr-[0.25em]"
              >
                <motion.span variants={childVariant} className="inline-block">
                  {word}
                </motion.span>
              </span>
            );
          });
        }
        return (
          <span key={i} className="inline-flex overflow-hidden mr-[0.25em]">
            <motion.span variants={childVariant} className="inline-block">
              {child}
            </motion.span>
          </span>
        );
      })}
    </MotionTag>
  );
}
