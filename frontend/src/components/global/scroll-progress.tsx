"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Fixed reading progress bar, mounted globally in ClientShell.
 * Replaces the per-page <ReadingProgress /> so every route gets exactly one bar.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-1 z-50 origin-left bg-gradient-to-r from-mint via-track-1 to-mint shadow-[0_0_10px_rgba(94,234,212,0.5)] pointer-events-none"
    />
  );
}
