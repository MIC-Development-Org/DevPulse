"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useModKey } from "@/lib/shortcut";
import {
  ShieldCheck,
  Zap,
  Command,
  GitBranch,
  Award,
} from "lucide-react";

/** Tiny keyboard-key chip used inside bento mockups. */
function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-mono text-foreground/60 shadow-sm">
      {children}
    </kbd>
  );
}

type Accent = "mint" | "blue" | "amber";

const ACCENTS: Record<Accent, { ring: string; glow: string; text: string; chip: string }> = {
  mint: {
    ring: "hover:border-mint/50",
    glow: "hover:shadow-[0_0_60px_-12px_rgba(94,234,212,0.35)]",
    text: "text-mint",
    chip: "bg-mint/10 border-mint/30",
  },
  blue: {
    ring: "hover:border-track-1/50",
    glow: "hover:shadow-[0_0_60px_-12px_rgba(138,180,255,0.35)]",
    text: "text-track-1",
    chip: "bg-track-1/10 border-track-1/30",
  },
  amber: {
    ring: "hover:border-track-2/50",
    glow: "hover:shadow-[0_0_60px_-12px_rgba(245,177,76,0.35)]",
    text: "text-track-2",
    chip: "bg-track-2/10 border-track-2/30",
  },
};

type Cell = {
  title: string;
  body: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: Accent;
  span: string;
  detail?: React.ReactNode;
};

function RevealCell({ cell, index }: { cell: Cell; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const accent = ACCENTS[cell.accent];
  const Icon = cell.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: (index % 3) * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className={`group relative overflow-hidden rounded-3xl border border-border bg-card/80 p-6 sm:p-8 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${accent.ring} ${accent.glow} ${cell.span}`}
    >
      {/* Hover gradient wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative z-10 space-y-3">
        <div
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accent.chip}`}
        >
          <Icon className={`h-5 w-5 ${accent.text}`} />
        </div>
        <h3 className="font-display text-lg font-bold text-foreground">{cell.title}</h3>
        <p className="text-sm text-foreground/60 leading-relaxed">{cell.body}</p>
        {cell.detail}
      </div>
    </motion.div>
  );
}

/**
 * Platform Superpowers — an airy bento grid that surfaces everything the
 * platform does, without competing with the hero or the track cards.
 */
export function BentoFeatures() {
  const modKey = useModKey();
  const cells: Cell[] = [
    {
      title: "Server-verified quizzes",
      body: "Every answer is scored server-side against an 80% mastery threshold — cheating is not a design flaw here.",
      icon: ShieldCheck,
      accent: "mint",
      span: "md:col-span-2",
      detail: (
        <div className="flex items-center gap-2 pt-2">
          <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] text-foreground/55">80% pass gate</span>
          <span className="rounded-full border border-border bg-background/60 px-2.5 py-1 font-mono text-[10px] text-foreground/55">concept explanations</span>
        </div>
      ),
    },
    {
      title: "XP, levels & streaks",
      body: "Progress you can feel. Earn XP on every verified module and challenge yourself to keep the flame alive.",
      icon: Zap,
      accent: "amber",
      span: "",
    },
    {
      title: "Live DAG visualiser",
      body: "Branch, commit and merge on a real-time graph. Git stops being abstract when you can watch the object graph breathe.",
      icon: GitBranch,
      accent: "mint",
      span: "md:col-span-2",
    },
    {
      title: "Free certifications",
      body: "Curated industry credentials paired directly to the curriculum — no walled garden, zero cost.",
      icon: Award,
      accent: "blue",
      span: "",
    },
    {
      title: "⌘K command palette",
      body: "One keystroke to jump anywhere — press the keys below while anywhere on the site to try it live.",
      icon: Command,
      accent: "blue",
      span: "md:col-span-3",
      detail: (
        <div className="pt-3" aria-hidden="true">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-2.5 backdrop-blur-sm">
            <Command className="h-4 w-4 shrink-0 text-foreground/40" />
            <span className="min-w-0 flex-1 truncate text-xs text-foreground/45">
              Search modules, tracks, certifications…
            </span>
            <span className="hidden sm:inline-flex shrink-0 gap-1">
              <KeyCap>{modKey}</KeyCap>
              <KeyCap>K</KeyCap>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/35">Try:</span>
            {["Git Basics", "Track 0 Roadmap", "XP & Levels", "Certificates"].map((q) => (
              <span key={q} className="rounded-full border border-border bg-background/60 px-2.5 py-1 text-[10px] font-mono text-foreground/55">
                {q}
              </span>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
        className="text-center space-y-3 max-w-2xl mx-auto mb-16"
      >
        <Badge variant="mint" className="text-xs uppercase font-mono tracking-wider">
          Platform Superpowers
        </Badge>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Engineered to keep you in flow
        </h2>
        <p className="text-sm sm:text-base text-foreground/60">
          The mechanics underneath the curriculum are what make it stick.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cells.map((cell, i) => (
          <RevealCell key={cell.title} cell={cell} index={i} />
        ))}
      </div>
    </section>
  );
}
