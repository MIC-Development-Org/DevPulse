"use client";

import * as React from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * Floating back-to-top button with a scroll-progress ring.
 * Bottom-LEFT placement: the toast stack owns the bottom-right corner.
 */
export function BackToTop() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 130, damping: 30, restDelta: 0.001 });
  const [visible, setVisible] = React.useState(false);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setVisible(v > 0.08 && v < 0.99);
  });

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          aria-label="Back to top"
          className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/90 text-foreground/70 shadow-lg backdrop-blur-md transition-colors hover:border-mint/50 hover:text-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {/* Progress ring */}
          <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="none" stroke="var(--border)" strokeWidth="2.5" />
            <motion.circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="#5EEAD4"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ pathLength: smooth }}
            />
          </svg>
          <ArrowUp className="h-4 w-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
