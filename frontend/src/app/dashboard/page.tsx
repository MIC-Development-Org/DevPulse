"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api/api-client";
import { UserProfile, Track } from "@/lib/contracts";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { readXPState, type XPState } from "@/lib/gamification/xp";
import {
  Flame,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
  GitBranch,
  CheckCircle2,
  Lock,
  Clock,
  Calendar,
  Layers,
  Cpu,
  Globe,
  Terminal,
  Zap,
  TrendingUp,
  Trophy,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);
      setCount(Math.round(current));
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count}{suffix}</>;
}

// ─── XP Progress Bar ─────────────────────────────────────────────────────────
function XPHeroBar({ xp }: { xp: XPState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
      className="rounded-2xl border border-border bg-slate-50 dark:bg-ink-950/50 p-4 flex items-center gap-4"
    >
      {/* Level badge */}
      <div
        className="flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 border font-display"
        style={{ borderColor: `${xp.levelColor}40`, background: `${xp.levelColor}15`, color: xp.levelColor }}
      >
        <span className="text-[10px] font-mono font-bold leading-none">LVL</span>
        <span className="text-lg font-black leading-none">{xp.level}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-foreground">{xp.levelTitle}</span>
          <span className="text-[11px] font-mono text-foreground/50">
            {xp.xpToNextLevel > 0 ? `${xp.xpToNextLevel} XP to next` : "MAX LEVEL"}
          </span>
        </div>
        <div className="relative w-full h-2.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: `linear-gradient(90deg, ${xp.levelColor}90, ${xp.levelColor})` }}
            initial={{ width: 0 }}
            animate={{ width: `${xp.progressInLevel}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          />
          {/* Shimmer */}
          <motion.div
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ left: ["-2rem", "100%"] }}
            transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="font-display text-base font-bold" style={{ color: xp.levelColor }}>
          {xp.totalXP.toLocaleString()}
        </span>
        <span className="text-[10px] font-mono text-foreground/50 block">TOTAL XP</span>
      </div>
    </motion.div>
  );
}

// ─── Heatmap cell ─────────────────────────────────────────────────────────────
const heatLevels = [
  "bg-slate-200/90 ring-1 ring-inset ring-black/[0.04] dark:bg-white/5 dark:ring-white/[0.03]",
  "bg-teal-200 ring-1 ring-inset ring-black/[0.03] dark:bg-mint/20 dark:ring-white/[0.03]",
  "bg-teal-400 ring-1 ring-inset ring-black/[0.03] dark:bg-mint/40 dark:ring-white/[0.03]",
  "bg-teal-500 ring-1 ring-inset ring-black/[0.03] dark:bg-mint/65 dark:ring-white/[0.03]",
  "bg-teal-600 ring-1 ring-inset ring-black/[0.03] dark:bg-mint shadow-[0_0_6px_rgba(94,234,212,0.5)] dark:ring-white/[0.03]",
];

// ─── Leaderboard entry ────────────────────────────────────────────────────────
const MOCK_LEADERBOARD = [
  { rank: 1, name: "Alex Rivera",   xp: 4820, level: 6, isYou: true  },
  { rank: 2, name: "Priya S.",      xp: 4210, level: 6, isYou: false },
  { rank: 3, name: "Marcus T.",     xp: 3780, level: 5, isYou: false },
  { rank: 4, name: "Laila M.",      xp: 3410, level: 5, isYou: false },
  { rank: 5, name: "Jin W.",        xp: 2990, level: 4, isYou: false },
];

// ─── Daily Mission ─────────────────────────────────────────────────────────
const DAILY_MISSIONS = [
  { id: "read",  label: "Read one module section",     xp: 50,  done: true  },
  { id: "quiz",  label: "Attempt a knowledge check",   xp: 100, done: false },
  { id: "visit", label: "Open the Git Visualiser",     xp: 30,  done: true  },
];

export default function DashboardPage() {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [calendarReady, setCalendarReady] = React.useState<boolean>(false);
  const [xpState, setXpState] = React.useState<XPState | null>(null);
  const [missionsDone, setMissionsDone] = React.useState<Record<string, boolean>>(
    Object.fromEntries(DAILY_MISSIONS.map((m) => [m.id, m.done]))
  );

  React.useEffect(() => {
    async function loadData() {
      try {
        const [userData, tracksData] = await Promise.all([
          api.getUserProfile(),
          api.getTracks(),
        ]);
        setUser(userData);
        setTracks(tracksData);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
    setXpState(readXPState());
    // Calendar dates depend on "today" — render after hydration to avoid
    // server/client date-time mismatches
    setCalendarReady(true);
  }, []);

  if (isLoading || !user) {
    return (
      <div className="max-w-7xl mx-auto py-24 px-4 flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-mint border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-foreground/50 font-mono">Loading dashboard...</p>
      </div>
    );
  }

  const totalModules = tracks.reduce((acc, t) => acc + t.modules.length, 0);
  const completedCount = user.completedModuleIds.length;
  const overallPercentage = Math.round((completedCount / totalModules) * 100);

  const currentMod = tracks.flatMap((t) => t.modules).find((m) => m.id === user.currentModuleId) || tracks[0]?.modules[0];
  const currentTrack = tracks.find((t) => t.id === currentMod?.trackId) || tracks[0];

  // LeetCode-style 16-week activity calendar — real dates, weeks run Sun→Sat
  const CAL_WEEKS = 16;
  const DAY_MS = 86400000;
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  startDate.setDate(startDate.getDate() - (CAL_WEEKS * 7 - 1));
  startDate.setDate(startDate.getDate() - startDate.getDay()); // snap back to Sunday

  const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const heatmapWeeks : { date: Date; level: 0 | 1 | 2 | 3 | 4 | -1; sessions: number }[][] = [];
  {
    const cursor = new Date(startDate);
    for (let w = 0; w < CAL_WEEKS; w++) {
      const week: { date: Date; level: 0 | 1 | 2 | 3 | 4 | -1; sessions: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(cursor);
        const isFuture = date > today;
        const r = Math.abs(Math.sin(Math.floor(date.getTime() / DAY_MS)) * 43758.5453) % 1;
        const level = isFuture
          ? (-1 as const)
          : ((r < 0.2 ? 0 : Math.min(4, 1 + Math.floor(r * 5))) as 0 | 1 | 2 | 3 | 4);
        const sessions = level === 0 || level === -1 ? 0 : level * 2 + Math.floor(r * 2);
        week.push({ date, level, sessions });
        cursor.setDate(cursor.getDate() + 1);
      }
      heatmapWeeks.push(week);
    }
  }

  // Month labels above the grid, exactly like LeetCode: shown on the column
  // that contains the 1st of a month, blank elsewhere.
  const monthLabels = heatmapWeeks.map((week, i) => {
    if (i === 0) return "";
    const firstOfMonth = week.find((c) => c.date.getDate() === 1);
    return firstOfMonth ? MONTH_SHORT[firstOfMonth.date.getMonth()] : "";
  });

  const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

  const missionsCompleted = Object.values(missionsDone).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">

      {/* ── 1. HERO HEADER ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-xl"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-mint/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-track-1/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 z-10 flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3 py-1 text-xs text-mint font-mono">
            <span>MIC 26-27 COHORT ACTIVE</span>
          </div>

          <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
            Welcome back,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-mint to-track-1">
              {user.name}
            </span>
          </h1>

          <p className="text-sm text-foreground/65 leading-relaxed max-w-lg">
            You are on a{" "}
            <strong className="text-foreground">{user.streakDays}-day streak</strong>.{" "}
            {completedCount} of {totalModules} modules completed across all three engineering tracks.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Badge variant="amber" className="text-xs py-1 px-3 gap-1.5">
              <Flame className="w-3.5 h-3.5 fill-amber-500" />
              {user.streakDays} Days Consecutive
            </Badge>
            <Badge variant="mint" className="text-xs py-1 px-3 gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Top 5% Cohort Pace
            </Badge>
          </div>

          {/* XP Bar */}
          {xpState && (
            <div className="pt-2 max-w-md">
              <XPHeroBar xp={xpState} />
            </div>
          )}
        </div>

        {/* Overall Ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="flex flex-col items-center z-10 shrink-0"
        >
          <ProgressRing value={overallPercentage} size={130} strokeWidth={11} color="mint">
            <div className="flex flex-col items-center">
              <span className="font-display text-2xl font-bold text-foreground">
                <AnimatedCounter target={overallPercentage} suffix="%" />
              </span>
              <span className="font-mono text-[10px] text-foreground/50">
                {completedCount}/{totalModules} DONE
              </span>
            </div>
          </ProgressRing>
          <span className="mt-2 text-xs font-semibold text-foreground/60">
            Total Curriculum
          </span>
        </motion.div>
      </motion.div>

      {/* ── 2. RESUME CARD ────────────────────────────────────────────────── */}
      {currentMod && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
        >
          <Card className="border-mint/25 bg-gradient-to-br from-mint/5 via-card to-card p-6 sm:p-7 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-48 h-48 bg-mint/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 z-10 relative">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-mint uppercase tracking-wider font-semibold">
                    Resume Your Active Module
                  </span>
                  <span className="text-foreground/30">•</span>
                  <span className="text-xs text-foreground/55">{currentTrack.title}</span>
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {currentMod.order}. {currentMod.title}
                </h2>

                <p className="text-xs sm:text-sm text-foreground/65 leading-relaxed">
                  {currentMod.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-foreground/55 pt-1 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-mint" /> ~{currentMod.estimatedMinutes} mins
                  </span>
                  {currentMod.hasGitVisualizer && (
                    <span className="flex items-center gap-1.5 text-mint font-medium">
                      <GitBranch className="w-3.5 h-3.5" /> Interactive DAG
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-track-1">
                    <Zap className="w-3.5 h-3.5" /> +50 XP on completion
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                <Link href={`/learn/${currentTrack.slug}/${currentMod.slug}`} className="w-full sm:w-auto">
                  <Button size="lg" variant="primary" className="w-full font-semibold shadow-md">
                    Continue Reading <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href={`/learn/${currentTrack.slug}/${currentMod.slug}/quiz`} className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full">
                    Take Module Quiz
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── 3. THREE-COLUMN SECONDARY GRID ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Daily Missions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-track-2" />
              <h3 className="font-display text-sm font-semibold text-foreground">Daily Missions</h3>
            </div>
            <span className="text-[11px] font-mono text-foreground/40">
              {missionsCompleted}/{DAILY_MISSIONS.length} done
            </span>
          </div>

          {/* Mission progress mini-bar */}
          <div className="h-1.5 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-track-2"
              initial={{ width: 0 }}
              animate={{ width: `${(missionsCompleted / DAILY_MISSIONS.length) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.4 }}
            />
          </div>

          <div className="space-y-2.5">
            {DAILY_MISSIONS.map((mission, i) => (
              <motion.button
                key={mission.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.07 }}
                onClick={() => setMissionsDone((prev) => ({ ...prev, [mission.id]: !prev[mission.id] }))}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left group",
                  missionsDone[mission.id]
                    ? "border-emerald-500/25 bg-emerald-500/5"
                    : "border-border/70 bg-slate-50 dark:bg-ink-950/40 hover:border-mint/30 hover:bg-mint/5"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-all",
                  missionsDone[mission.id]
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-border/60 group-hover:border-mint"
                )}>
                  {missionsDone[mission.id] && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className={cn(
                  "flex-1 text-xs font-medium",
                  missionsDone[mission.id] ? "text-foreground/50 line-through" : "text-foreground"
                )}>
                  {mission.label}
                </span>
                <span className={cn(
                  "text-[10px] font-mono font-bold shrink-0",
                  missionsDone[mission.id] ? "text-emerald-600 dark:text-emerald-400" : "text-blue-700 dark:text-track-1"
                )}>
                  +{mission.xp} XP
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-track-2" />
            <h3 className="font-display text-sm font-semibold text-foreground">Cohort Leaderboard</h3>
          </div>
          <div className="space-y-2">
            {MOCK_LEADERBOARD.map((entry, i) => (
              <motion.div
                key={entry.name}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl transition-colors",
                  entry.isYou
                    ? "border border-mint/25 bg-mint/5"
                    : "border border-transparent hover:bg-slate-50 dark:hover:bg-ink-950/40"
                )}
              >
                <span className={cn(
                  "w-5 text-center font-mono text-xs font-bold shrink-0",
                  entry.rank === 1 ? "text-track-2" : "text-foreground/40"
                )}>
                  {entry.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-xs font-semibold truncate",
                    entry.isYou ? "text-mint" : "text-foreground"
                  )}>
                    {entry.isYou ? "You" : entry.name}
                  </p>
                  <p className="text-[10px] font-mono text-foreground/40">Level {entry.level}</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-foreground/70 shrink-0">
                  {entry.xp.toLocaleString()} XP
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Quiz Results */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-track-1" />
            <h3 className="font-display text-sm font-semibold text-foreground">Mastery Verification</h3>
          </div>
          <p className="text-[11px] text-foreground/55">
            Server-scored at 80% gate. Results below are final.
          </p>
          <div className="space-y-2.5">
            {Object.entries(user.quizScores).map(([mId, score], i) => {
              const mod = tracks.flatMap((t) => t.modules).find((m) => m.id === mId);
              if (!mod) return null;
              return (
                <motion.div
                  key={mId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  className="p-3 rounded-xl border border-border/70 bg-slate-50 dark:bg-ink-950/40 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate pr-2">
                    <p className="font-semibold text-foreground truncate">{mod.title}</p>
                    <p className="text-[10px] text-foreground/45 font-mono">
                      Track 0{mod.trackSlug === "web-foundations" ? "0" : "1"}
                    </p>
                  </div>
                  <Badge
                    variant={score >= 80 ? "emerald" : "rose"}
                    className="font-mono text-xs shrink-0"
                  >
                    {score}%
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── 4. TRACK BREAKDOWN ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">Curriculum Tracks</h2>
          <Link href="/learn" className="text-xs text-mint hover:underline font-semibold flex items-center gap-1">
            View All Paths <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {tracks.map((track, i) => {
            const trackCompleted = track.modules.filter((m) =>
              user.completedModuleIds.includes(m.id)
            ).length;
            const trackPct = Math.round((trackCompleted / track.modules.length) * 100);
            const accentClasses = {
              mint:  { border: "hover:border-mint/50",    bg: "from-mint/5",    ring: "text-mint" },
              blue:  { border: "hover:border-track-1/50", bg: "from-track-1/5", ring: "text-track-1" },
              amber: { border: "hover:border-track-2/50", bg: "from-track-2/5", ring: "text-track-2" },
            }[track.color];

            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
              >
                <Card className={cn(
                  "p-5 border-border bg-card flex flex-col justify-between group transition-all duration-300 overflow-hidden relative",
                  accentClasses.border
                )}>
                  {/* Ambient glow on hover */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    accentClasses.bg,
                    "to-transparent"
                  )} />

                  <div className="space-y-4 relative z-10">
                    <div className="flex items-center justify-between">
                      <Badge variant={track.color} className="text-[10px] font-mono">
                        Track 0{track.trackNumber}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-foreground/60">
                        {trackCompleted}/{track.modules.length}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">{track.title}</h3>
                      <p className="text-xs text-foreground/55 line-clamp-2 mt-1 leading-relaxed">
                        {track.description}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono text-foreground/45">
                        <span>Progress</span>
                        <span className={accentClasses.ring}>{trackPct}%</span>
                      </div>
                      <ProgressBar value={trackPct} color={track.color} />
                    </div>
                  </div>

                  <div className="pt-5 relative z-10">
                    <Link href={`/learn/${track.slug}`} className="block">
                      <Button variant="secondary" className="w-full text-xs font-medium justify-between group-hover:border-inherit">
                        <span>View Trail</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── 5. HEATMAP ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-mint" />
            <h3 className="font-display text-base font-semibold text-foreground">Learning Activity</h3>
          </div>
          <span className="text-xs text-foreground/45 font-mono">Last 16 Weeks</span>
        </div>

        {/* Month row + weekday gutter + grid — LeetCode-style */}
        <div className="overflow-x-auto no-scrollbar">
          {calendarReady ? (
          <div className="w-max mx-auto">
            {/* Month labels */}
            <div className="ml-7 flex gap-[3px] mb-1.5 select-none" aria-hidden="true">
              {monthLabels.map((label, i) => (
                <span key={i} className="w-3.5 text-center text-[10px] font-mono text-foreground/45">
                  {label}
                </span>
              ))}
            </div>

            <div className="flex">
              {/* Weekday gutter */}
              <div className="mr-1.5 flex flex-col gap-[3px] select-none" aria-hidden="true">
                {DAY_LABELS.map((label, i) => (
                  <span key={i} className="h-3.5 text-[10px] leading-[14px] text-left font-mono text-foreground/45">
                    {label}
                  </span>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex gap-[3px]">
                {heatmapWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((cell, di) =>
                      cell.level === -1 ? (
                        <div key={di} className="h-3.5 w-3.5" />
                      ) : (
                        <div
                          key={di}
                          title={
                            cell.sessions === 0
                              ? `No sessions on ${cell.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`
                              : `${cell.sessions} sessions on ${cell.date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`
                          }
                          className={cn(
                            "h-3.5 w-3.5 rounded-[4px] leading-none transition-all duration-150 cursor-default hover:ring-1 hover:ring-mint/60 hover:scale-125",
                            heatLevels[cell.level]
                          )}
                        />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          ) : (
            <div className="h-[136px]" aria-hidden="true" />
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-foreground/40 font-mono">
          <span>Consistent study accelerates long-term retention.</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            {heatLevels.map((cls, i) => (
              <div key={i} className={cn("w-3 h-3 rounded-sm", cls)} />
            ))}
            <span>More</span>
          </div>
        </div>
      </motion.div>

      {/* ── 6. UPCOMING FEATURES ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-dashed border-border p-6 bg-card/40 space-y-4"
      >
        <div className="flex items-center gap-2 text-foreground/55">
          <Sparkles className="w-4 h-4 text-mint" />
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
            Phase 2 Platform Preview
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Zap,
              color: "text-mint",
              title: "AI Diagnostic Onboarding",
              desc: "Assess prerequisites, skip familiar material, receive a personalized learning path.",
            },
            {
              icon: Terminal,
              color: "text-track-1",
              title: "In-Browser WebContainer",
              desc: "Execute Node.js and Solidity in-browser with live AST inspection and heap profiling.",
            },
            {
              icon: Award,
              color: "text-track-2",
              title: "On-Chain Cohort Badges",
              desc: "Soulbound NFT attestations of completed modules verified by MIC Development Dept.",
            },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
              <p className={cn("text-xs font-semibold flex items-center gap-1.5", color)}>
                <Icon className="w-3.5 h-3.5" /> {title}
              </p>
              <p className="text-xs text-foreground/55 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
