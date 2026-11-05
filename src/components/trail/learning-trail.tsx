"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Track, ModuleMeta, UserProfile } from "@/lib/contracts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle2,
  Lock,
  Play,
  Clock,
  ArrowRight,
  GitBranch,
  Video,
  Zap,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LearningTrailProps {
  track: Track;
  user: UserProfile;
}

// ─── Node icon (hex-shaped) ───────────────────────────────────────────────────
function NodeIcon({
  status,
  order,
  accent,
}: {
  status: "completed" | "current" | "locked";
  order: number;
  accent: string;
}) {
  const baseClass =
    "flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all duration-500 relative";

  return (
    <div
      className={cn(
        baseClass,
        status === "completed"
          ? "border-emerald-400 bg-card text-emerald-600 dark:text-emerald-400 shadow-[0_0_24px_rgba(52,211,153,0.45)]"
          : status === "current"
          ? "bg-card text-mint shadow-[0_0_30px_rgba(94,234,212,0.7)] scale-110"
          : "border-border bg-slate-100 dark:bg-ink-950 text-foreground/30"
      )}
      style={status === "current" ? { borderColor: accent, color: accent } : undefined}
    >
      {/* Pulse ring for current node */}
      {status === "current" && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{ borderColor: accent, borderWidth: 2 }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {status === "completed" ? (
        <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
      ) : status === "current" ? (
        <span className="font-display font-black text-sm">{order}</span>
      ) : (
        <Lock className="w-5 h-5" />
      )}
    </div>
  );
}

// ─── Individual Trail Node ────────────────────────────────────────────────────
function TrailNode({
  module,
  idx,
  isCompleted,
  isCurrent,
  isLocked,
  track,
  colorStyles,
}: {
  module: ModuleMeta;
  idx: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
  track: Track;
  colorStyles: { accent: string; badge: string; glow: string };
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = idx % 2 === 0;

  const status = isCompleted ? "completed" : isCurrent ? "current" : "locked";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: idx * 0.06, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "relative flex flex-col sm:flex-row items-start sm:items-center gap-6",
        isEven ? "sm:flex-row-reverse" : "sm:flex-row"
      )}
    >
      {/* Node Card */}
      <div
        className={cn(
          "w-full sm:w-[calc(50%-4rem)] pl-20 sm:pl-0",
          isEven ? "sm:text-right" : "sm:text-left"
        )}
      >
        <div
          className={cn(
            "group rounded-2xl border p-5 transition-all duration-300 relative overflow-hidden",
            isCompleted
              ? "border-emerald-500/30 bg-card hover:border-emerald-500/50 shadow-sm"
              : isCurrent
              ? "border-mint/60 bg-card ring-1 ring-mint/40 shadow-[0_0_40px_-8px_rgba(94,234,212,0.25)]"
              : "border-border/50 bg-slate-50/70 dark:bg-ink-950/30 opacity-65 hover:opacity-80 cursor-not-allowed"
          )}
        >
          {/* Hover shimmer */}
          {!isLocked && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
            />
          )}

          {/* XP reward badge */}
          {!isLocked && (
            <div
              className={cn(
                "absolute top-3 flex items-center gap-1 text-[10px] font-mono font-bold",
                isEven ? "left-3 sm:left-auto sm:right-3" : "right-3 sm:right-auto sm:left-3"
              )}
            >
              <Zap className="w-2.5 h-2.5 text-track-1" />
              <span className="text-track-1">+50 XP</span>
            </div>
          )}

          <div
            className={cn(
              "flex items-center gap-2 mb-2 text-xs mt-3",
              isEven ? "sm:justify-end" : "sm:justify-start"
            )}
          >
            <Badge
              variant={isCompleted ? "emerald" : isCurrent ? "mint" : "outline"}
              className="text-[10px]"
            >
              {isCompleted ? "Completed" : isCurrent ? "Current Focus" : "Locked"}
            </Badge>
            <span className="text-foreground/45 font-mono text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" /> {module.estimatedMinutes}m
            </span>
          </div>

          <h3
            className={cn(
              "font-display text-base font-semibold text-foreground transition-colors",
              !isLocked && "group-hover:text-mint"
            )}
          >
            {module.order}. {module.title}
          </h3>

          <p className="text-xs text-foreground/55 line-clamp-2 mt-1.5 leading-relaxed">
            {module.description}
          </p>

          {/* Feature tags */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border/40 text-[11px] text-foreground/55",
              isEven ? "sm:justify-end" : "sm:justify-start"
            )}
          >
            {module.hasGitVisualizer && (
              <span className="inline-flex items-center gap-1 text-mint font-medium">
                <GitBranch className="w-3.5 h-3.5" /> Interactive DAG
              </span>
            )}
            {module.video && (
              <span className="inline-flex items-center gap-1 text-track-1 font-medium">
                <Video className="w-3.5 h-3.5" /> Video Card
              </span>
            )}
          </div>

          {/* Action */}
          <div
            className={cn(
              "mt-4 flex items-center",
              isEven ? "sm:justify-end" : "sm:justify-start"
            )}
          >
            {!isLocked ? (
              <Link href={`/learn/${track.slug}/${module.slug}`}>
                <Button
                  size="sm"
                  variant={isCurrent ? "primary" : "outline"}
                  className="text-xs h-8 font-semibold"
                >
                  {isCompleted ? "Review Module" : "Continue Lesson"}{" "}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-foreground/40 italic">
                <Lock className="w-3.5 h-3.5" />
                <span>Complete previous module to unlock</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center Node Circle */}
      <div className="absolute left-3 sm:left-1/2 -translate-x-1/2 top-3 sm:top-auto z-10">
        <NodeIcon status={status} order={module.order} accent={colorStyles.accent} />
      </div>

      {/* Spacer */}
      <div className="hidden sm:block sm:w-[calc(50%-4rem)]" />
    </motion.div>
  );
}

// ─── Main Trail Component ─────────────────────────────────────────────────────
export function LearningTrail({ track, user }: LearningTrailProps) {
  const completedSet = new Set(user.completedModuleIds);
  const unlockedSet = new Set(user.unlockedModuleIds);

  if (track.modules.length > 0) {
    unlockedSet.add(track.modules[0].id);
  }

  const colorStyles = {
    mint: {
      accent: "#5EEAD4",
      badge: "border-mint/30 bg-mint/10 text-mint",
      glow: "shadow-[0_0_25px_rgba(94,234,212,0.35)]",
    },
    blue: {
      accent: "#8AB4FF",
      badge: "border-track-1/30 bg-track-1/10 text-track-1",
      glow: "shadow-[0_0_25px_rgba(138,180,255,0.35)]",
    },
    amber: {
      accent: "#F5B14C",
      badge: "border-track-2/30 bg-track-2/10 text-track-2",
      glow: "shadow-[0_0_25px_rgba(245,177,76,0.35)]",
    },
  }[track.color];

  const completedCount = track.modules.filter((m) => completedSet.has(m.id)).length;
  const totalXPAvailable = track.modules.length * 200; // 50 read + 150 quiz per module (approx)

  return (
    <div className="relative py-12 max-w-4xl mx-auto px-4 sm:px-6">
      {/* Track completion stats bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 p-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm flex flex-wrap items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <p className="text-xs font-mono text-foreground/50 uppercase tracking-wider">Track Progress</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold" style={{ color: colorStyles.accent }}>
              {completedCount}
            </span>
            <span className="text-sm text-foreground/60">/ {track.modules.length} modules</span>
          </div>
        </div>
        <div className="flex-1 min-w-[120px] max-w-xs">
          <div className="flex justify-between text-[11px] font-mono text-foreground/40 mb-1.5">
            <span>Completion</span>
            <span>{Math.round((completedCount / track.modules.length) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: colorStyles.accent }}
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / track.modules.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-foreground/40">Available XP</p>
          <p className="font-display text-sm font-bold text-track-1">+{totalXPAvailable} XP</p>
        </div>
      </motion.div>

      {/* Central Trail Line */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute left-10 sm:left-1/2 top-10 bottom-10 w-0.5 -translate-x-1/2 bg-gradient-to-b opacity-30"
          style={{
            backgroundImage: `linear-gradient(to bottom, ${colorStyles.accent}, #8AB4FF, #F5B14C40)`,
          }}
        />

        {/* Animated progress fill on trail line */}
        <motion.div
          aria-hidden="true"
          className="absolute left-10 sm:left-1/2 top-10 w-0.5 -translate-x-1/2"
          style={{ background: colorStyles.accent }}
          initial={{ height: 0 }}
          animate={{ height: `${(completedCount / track.modules.length) * 100}%` }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
        />

        <div className="space-y-14 sm:space-y-20">
          {track.modules.map((module, idx) => {
            const isCompleted = completedSet.has(module.id);
            const isUnlocked = unlockedSet.has(module.id) || isCompleted;
            const isLocked = !isUnlocked;
            const isCurrent = isUnlocked && !isCompleted;

            return (
              <TrailNode
                key={module.id}
                module={module}
                idx={idx}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isLocked={isLocked}
                track={track}
                colorStyles={colorStyles}
              />
            );
          })}
        </div>
      </div>

      {/* Completion banner */}
      {completedCount === track.modules.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="mt-16 text-center p-8 rounded-3xl border border-track-2/30 bg-track-2/5"
        >
          <Star className="w-10 h-10 text-track-2 mx-auto mb-3 fill-track-2/30" />
          <h3 className="font-display text-2xl font-bold text-foreground mb-2">
            Track Complete!
          </h3>
          <p className="text-sm text-foreground/60">
            You have mastered all modules in {track.title}. Advance to the next track.
          </p>
        </motion.div>
      )}
    </div>
  );
}
