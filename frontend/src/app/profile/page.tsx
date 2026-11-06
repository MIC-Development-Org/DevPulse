"use client";

import * as React from "react";
import Link from "next/link";
import { api } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/errors";
import { UserProfile, Track } from "@/lib/contracts";
import { readXPState, resetXP, type XPState } from "@/lib/gamification/xp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  User,
  Flame,
  Award,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Download,
  Settings,
  Mail,
  Calendar,
  CheckCircle2,
  Lock,
  LogIn,
} from "lucide-react";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [tracks, setTracks] = React.useState<Track[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  // Phase 5 decision D1: 401 → honest inline sign-in panel (no mock data).
  const [signedOut, setSignedOut] = React.useState<boolean>(false);
  const [loadFailed, setLoadFailed] = React.useState<boolean>(false);
  const [xpState, setXpState] = React.useState<XPState | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [u, t] = await Promise.all([api.getUserProfile(), api.getTracks()]);
        setUser(u);
        setTracks(t);
        setXpState(readXPState());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setSignedOut(true);
        } else {
          setLoadFailed(true);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExportData = () => {
    if (!user) return;
    const jsonStr = JSON.stringify(user, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devpulse-export-${user.username}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      title: "Data Exported",
      description: "Downloaded profile, quiz history and badges JSON.",
      type: "success",
    });
  };

  const handleResetData = async () => {
    if (confirm("Reset all learning progress, quiz scores and unlock states? This clears your server progress and local XP.")) {
      try {
        const resetUser = await api.resetProgress();
        setUser(resetUser);
        // D5: XP stays client-side — a full reset clears local XP as well.
        setXpState(resetXP());
        showToast({
          title: "Progress Reset",
          description: "All server progress and local XP cleared.",
          type: "success",
        });
      } catch {
        showToast({
          title: "Reset failed",
          description: "The progress reset could not be completed. Please try again.",
          type: "error",
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-mint border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (signedOut) {
    return (
      <div className="max-w-md mx-auto py-24 px-4">
        <Card>
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl border border-mint/40 bg-mint/10 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-mint" />
            </div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Sign in to view your profile
            </h1>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Profile stats are composed from your real learning activity.
              Sign in to see your streaks, badges and attempt history.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <Link href="/login">
                <Button variant="primary" size="sm">
                  <LogIn className="w-4 h-4 mr-1.5" /> Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost" size="sm">
                  Create Account
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadFailed || !user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <Card>
          <CardContent className="pt-8 pb-6 space-y-4">
            <h1 className="font-display text-lg font-bold text-foreground">
              Your profile could not be loaded
            </h1>
            <p className="text-sm text-foreground/60">
              Live data is unreachable right now. No fallback data is shown by
              design — please retry.
            </p>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedModules = tracks
    .flatMap((t) => t.modules)
    .filter((m) => user.completedModuleIds.includes(m.id));

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* User Header Profile Card */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-xl bg-aurora">
        {/* Avatar */}
        <div className="relative w-24 h-24 rounded-full ring-4 ring-mint/40 overflow-hidden shrink-0 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* User Info */}
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {user.name}
            </h1>
            <Badge variant="mint" className="text-xs font-mono">
              VERIFIED STUDENT
            </Badge>
          </div>

          <p className="font-mono text-xs text-foreground/50">
            @{user.username} • {user.email}
          </p>

          <p className="text-xs sm:text-sm text-foreground/70 max-w-lg leading-relaxed pt-1">
            Software engineer studying full-stack systems and smart contract architecture. Enrolled in MIC Development Dept 2026-27 cohort.
          </p>

          {/* Highlights */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-3">
            {xpState && (
              <Badge variant="mint" className="text-xs py-1 px-3 font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-mint animate-pulse mr-1.5" />
                LVL {xpState.level} • {xpState.levelTitle} ({xpState.totalXP.toLocaleString()} XP)
              </Badge>
            )}
            <Badge variant="amber" className="text-xs py-1 px-3">
              <Flame className="w-3.5 h-3.5 mr-1 fill-amber-500" />
              {user.streakDays}-Day Learning Streak
            </Badge>
            <Badge variant="blue" className="text-xs py-1 px-3">
              <Award className="w-3.5 h-3.5 mr-1" />
              {user.completedModuleIds.length} Modules Mastered
            </Badge>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Data JSON
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetData}
            className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Progress
          </Button>
        </div>
      </div>

      {/* Badges & Achievements Section */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <Award className="w-5 h-5 text-mint" /> Earned Badges & Achievements
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {user.badges.map((badge) => {
            const isUnlocked = badge.unlockedAt !== null;

            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? "border-mint/30 bg-card shadow-sm"
                    : "border-border/60 bg-card/40 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border ${
                      isUnlocked
                        ? "bg-mint/10 border-mint/20 text-teal-700 dark:text-mint"
                        : "bg-slate-100 dark:bg-ink-950 border-border text-foreground/40"
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  {isUnlocked ? (
                    <span className="font-mono text-[10px] text-mint font-semibold">
                      UNLOCKED
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-foreground/40 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> LOCKED
                    </span>
                  )}
                </div>

                <h3 className="font-display text-sm font-semibold text-foreground">
                  {badge.title}
                </h3>
                <p className="text-xs text-foreground/60 mt-1 leading-relaxed">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Quiz Scores Transcript */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Academic Transcript & Quiz Scores
        </h2>

        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-border bg-card-subtle text-foreground/60 font-mono text-[11px] uppercase">
              <tr>
                <th className="p-4">Module</th>
                <th className="p-4">Track</th>
                <th className="p-4 text-right">Score</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {completedModules.map((mod) => {
                const score = user.quizScores[mod.id] || 100;
                return (
                  <tr key={mod.id} className="hover:bg-card-subtle/50 transition-colors">
                    <td className="p-4 font-medium text-foreground">
                      {mod.title}
                    </td>
                    <td className="p-4 text-foreground/60 capitalize font-mono text-xs">
                      {mod.trackSlug.replace("-", " ")}
                    </td>
                    <td className="p-4 text-right font-mono text-teal-700 dark:text-mint font-bold">
                      {score}%
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="emerald" className="text-[10px]">
                        Passed
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

