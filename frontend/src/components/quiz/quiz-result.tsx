"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useSpring, useTransform } from "framer-motion";
import confetti from "canvas-confetti";
import { QuizResult as QuizResultType } from "@/lib/contracts";
import { ProgressRing } from "../ui/progress-ring";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { addXP, readXPState } from "@/lib/gamification/xp";
import { LevelUpOverlay } from "@/components/gamification/achievement-toast";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  ListChecks,
  Zap,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizResultProps {
  result: QuizResultType;
  trackSlug: string;
  moduleSlug: string;
  onRetry: () => void;
}

// Animated XP reward counter
function XPRewardCounter({ xp, isPerfect }: { xp: number; isPerfect: boolean }) {
  const [displayed, setDisplayed] = React.useState(0);

  React.useEffect(() => {
    const duration = 1400;
    const steps = 50;
    const inc = xp / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      setDisplayed(Math.min(Math.round(inc * step), xp));
      if (step >= steps) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [xp]);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
      className={cn(
        "inline-flex items-center gap-2 rounded-2xl border px-5 py-3",
        isPerfect
          ? "border-track-2/40 bg-track-2/10"
          : "border-mint/30 bg-mint/10"
      )}
    >
      <Zap className={cn("w-5 h-5", isPerfect ? "text-track-2" : "text-mint")} />
      <div>
        <span className={cn(
          "font-display text-2xl font-black",
          isPerfect ? "text-track-2" : "text-mint"
        )}>
          +{displayed}
        </span>
        <span className={cn(
          "font-display text-2xl font-black",
          isPerfect ? "text-track-2" : "text-mint"
        )}>
          {" "}XP
        </span>
        <p className="text-[11px] font-mono text-foreground/50 mt-0.5">
          {isPerfect ? "Perfect Score Bonus!" : "Module Mastered"}
        </p>
      </div>
    </motion.div>
  );
}

export function QuizResultView({
  result,
  trackSlug,
  moduleSlug,
  onRetry,
}: QuizResultProps) {
  const isPerfect = result.percentage === 100;
  const xpEarned = isPerfect ? 500 : result.passed ? 200 : 0;
  const [levelUp, setLevelUp] = React.useState<{ level: number; title: string } | null>(null);
  const xpAwardedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!result.passed) return;
    if (xpAwardedRef.current === result.submissionId) return;
    xpAwardedRef.current = result.submissionId;

    const before = readXPState();
    addXP(xpEarned);
    const after = readXPState();
    if (after.level > before.level) {
      setLevelUp({ level: after.level, title: after.levelTitle });
    }
    // Notify the navbar so the XP pill flashes/animates
    window.dispatchEvent(new CustomEvent("devpulse:xp-gain"));
  }, [result.passed, result.submissionId, xpEarned]);

  React.useEffect(() => {
    if (!result.passed) return;
    const delay = setTimeout(() => {
      try {
        confetti({
          particleCount: isPerfect ? 160 : 90,
          spread: isPerfect ? 100 : 70,
          origin: { y: 0.55 },
          colors: ["#5EEAD4", "#8AB4FF", "#F5B14C", "#10B981"],
          scalar: 1.2,
        });
        if (isPerfect) {
          setTimeout(() => {
            confetti({ particleCount: 60, spread: 140, origin: { x: 0, y: 0.6 }, colors: ["#F5B14C", "#FFD700"] });
            confetti({ particleCount: 60, spread: 140, origin: { x: 1, y: 0.6 }, colors: ["#5EEAD4", "#8AB4FF"] });
          }, 400);
        }
      } catch { /* fallback */ }
    }, 200);
    return () => clearTimeout(delay);
  }, [result.passed, isPerfect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8"
    >
      {/* ── Hero result card ── */}
      <div
        className={cn(
          "rounded-3xl border p-6 sm:p-10 text-center relative overflow-hidden backdrop-blur-xl",
          result.passed
            ? "border-emerald-500/30 bg-emerald-500/5 shadow-[0_0_60px_-12px_rgba(16,185,129,0.25)]"
            : "border-rose-500/30 bg-rose-500/5 shadow-[0_0_60px_-12px_rgba(244,63,94,0.15)]"
        )}
      >
        {/* Background orb */}
        <div
          className={cn(
            "absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none",
            result.passed ? "bg-emerald-400" : "bg-rose-400"
          )}
        />

        <div className="flex flex-col items-center space-y-5 relative z-10">
          {/* Status pill */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 24 }}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider",
              result.passed
                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                : "bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30"
            )}
          >
            {result.passed ? (
              <><Sparkles className="w-3.5 h-3.5" /> Module Mastered</>
            ) : (
              <><AlertTriangle className="w-3.5 h-3.5" /> Not Yet — Mastery Required</>
            )}
          </motion.div>

          {/* Score ring */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 22 }}
            className="py-2"
          >
            <ProgressRing
              value={result.percentage}
              size={148}
              strokeWidth={11}
              color={result.passed ? "emerald" : "rose"}
            >
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-bold tracking-tight text-foreground">
                  {result.percentage}%
                </span>
                <span className="font-mono text-[11px] text-foreground/50">
                  {result.score} / {result.totalQuestions}
                </span>
              </div>
            </ProgressRing>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight"
          >
            {isPerfect
              ? "Flawless Victory!"
              : result.passed
              ? "Next Module Unlocked!"
              : "Keep Pushing Forward"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-foreground/65 max-w-lg leading-relaxed"
          >
            {result.message}
          </motion.p>

          {/* XP Reward */}
          {result.passed && (
            <XPRewardCounter xp={xpEarned} isPerfect={isPerfect} />
          )}

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            className="pt-2 flex flex-wrap items-center justify-center gap-3"
          >
            {result.passed ? (
              <>
                <Link href={`/learn/${trackSlug}`}>
                  <Button variant="primary" size="lg" className="px-6 font-semibold">
                    Return to Learning Trail <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" onClick={onRetry}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Retake for Perfect Score
                </Button>
              </>
            ) : (
              <>
                <Button variant="primary" size="lg" onClick={onRetry} className="px-6">
                  <RotateCcw className="w-4 h-4 mr-2" /> Retry Quiz (Shuffled)
                </Button>
                <Link href={`/learn/${trackSlug}/${moduleSlug}`}>
                  <Button variant="outline" size="lg">
                    <BookOpen className="w-4 h-4 mr-2" /> Review Lesson Material
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Topic breakdown ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <ListChecks className="w-5 h-5 text-mint" />
          <h3 className="font-display text-base font-semibold text-foreground">
            Topic Performance Breakdown
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.topicBreakdown.map((t, i) => (
            <motion.div
              key={t.topic}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.06 }}
              className="p-4 rounded-xl border border-border/70 bg-slate-50 dark:bg-ink-950/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">{t.topic}</p>
                <Badge
                  variant={t.percentage >= 80 ? "emerald" : t.percentage >= 50 ? "amber" : "rose"}
                  className="font-mono text-xs"
                >
                  {t.percentage}%
                </Badge>
              </div>
              <p className="text-[11px] text-foreground/45">
                {t.correct} of {t.total} correct
              </p>
              {/* Mini bar */}
              <div className="h-1 rounded-full bg-border overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    t.percentage >= 80 ? "bg-emerald-400" : t.percentage >= 50 ? "bg-track-2" : "bg-rose-400"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${t.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.65 + i * 0.06 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Missed topics ── */}
      {result.missedTopics.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-border bg-card p-6 space-y-4"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="font-display text-base font-semibold text-foreground">
                Targeted Concept Review
              </h3>
              <p className="text-xs text-foreground/45">Detailed explanations for questions you missed.</p>
            </div>
          </div>

          <div className="space-y-3">
            {result.missedTopics.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75 + idx * 0.06 }}
                className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{item.topic}</span>
                  <Badge variant="outline" className="text-[10px]">Needs Practice</Badge>
                </div>
                <p className="text-xs font-medium text-foreground">{item.reviewConcept}</p>
                <p className="text-xs text-foreground/65 leading-relaxed pt-1 border-t border-border/40">
                  {item.explanation}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Level-up celebration overlay (shown when XP award crosses a level) */}
      {levelUp && (
        <LevelUpOverlay
          newLevel={levelUp.level}
          levelTitle={levelUp.title}
          onDismiss={() => setLevelUp(null)}
        />
      )}
    </motion.div>
  );
}
