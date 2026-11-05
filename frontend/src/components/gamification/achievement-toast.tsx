"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface XPGainToastProps {
  amount: number;
  label: string;
  onDismiss: () => void;
}

export function XPGainToast({ amount, label, onDismiss }: XPGainToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 2800);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-mint/30 bg-ink-950/90 dark:bg-ink-950/95 backdrop-blur-xl px-5 py-3.5 shadow-[0_0_40px_-8px_rgba(94,234,212,0.4)] pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {/* XP bubble */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 500, damping: 24 }}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-mint/15 border border-mint/30"
      >
        <span className="font-display font-bold text-mint text-sm">XP</span>
      </motion.div>

      <div>
        <motion.p
          initial={{ x: -4, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-display font-bold text-mint text-base leading-tight"
        >
          +{amount} XP
        </motion.p>
        <p className="text-[11px] text-foreground/60 font-mono">{label}</p>
      </div>
    </motion.div>
  );
}

/* ---------- Achievement unlock toast ---------- */

interface AchievementToastProps {
  title: string;
  description: string;
  onDismiss: () => void;
}

export function AchievementToast({ title, description, onDismiss }: AchievementToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 120 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 120 }}
      transition={{ type: "spring", stiffness: 350, damping: 30 }}
      className="fixed bottom-6 right-6 z-50 max-w-xs rounded-2xl border border-track-2/40 bg-ink-950/95 backdrop-blur-xl shadow-[0_0_50px_-10px_rgba(245,177,76,0.4)] overflow-hidden"
    >
      {/* shimmer bar */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-track-2/0 via-track-2 to-track-2/0"
        initial={{ scaleX: 0, originX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 3.8, ease: "linear" }}
      />
      <div className="p-4 flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-track-2/15 border border-track-2/30 shrink-0">
          <svg className="w-5 h-5 text-track-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-track-2 uppercase tracking-widest mb-0.5">Achievement Unlocked</p>
          <p className="font-display font-bold text-foreground text-sm leading-tight">{title}</p>
          <p className="text-[11px] text-foreground/60 mt-0.5 leading-snug">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------- Level-up full-screen overlay ---------- */

interface LevelUpOverlayProps {
  newLevel: number;
  levelTitle: string;
  onDismiss: () => void;
}

export function LevelUpOverlay({ newLevel, levelTitle, onDismiss }: LevelUpOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/80 backdrop-blur-md"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.1, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="text-center p-12 rounded-3xl border border-mint/30 bg-card/95 shadow-[0_0_80px_-15px_rgba(94,234,212,0.5)] max-w-sm mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl mb-4 font-display font-black text-mint"
          >
            LVL {newLevel}
          </motion.div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Level Up!</h2>
          <p className="text-foreground/70 text-sm mb-2">You are now a</p>
          <p className="font-display text-xl font-bold text-mint mb-6">{levelTitle}</p>
          <button
            onClick={onDismiss}
            className="px-6 py-2.5 rounded-xl bg-mint text-ink-950 font-semibold text-sm hover:bg-mint/90 transition-colors"
          >
            Keep Going
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

