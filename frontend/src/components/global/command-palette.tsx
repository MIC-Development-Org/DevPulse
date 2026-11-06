"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  Search,
  BookOpen,
  Compass,
  Award,
  User,
  Sun,
  Moon,
  RotateCcw,
  GitBranch,
  Terminal,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "../ui/toast";
import { api } from "@/lib/api/api-client";
import { resetXP } from "@/lib/gamification/xp";
import type { Track } from "@/lib/contracts";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  // Phase 4: module navigation comes from the real DB-backed API. Fetched
  // when the palette opens; failures are disclosed (never silently emptied).
  const [tracks, setTracks] = React.useState<Track[] | null>(null);
  const [tracksFailed, setTracksFailed] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .getTracks()
      .then((data) => {
        if (!cancelled) {
          setTracks(data);
          setTracksFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTracks(null);
          setTracksFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Lock page scroll while the palette is open
  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSelect = (callback: () => void) => {
    onOpenChange(false);
    callback();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:pt-28" role="dialog" aria-modal="true" aria-label="Command palette">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Palette Container */}
      <div className="relative z-50 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden palette-pop">
        <Command className="w-full bg-transparent">
          <div className="flex items-center px-4 border-b border-border">
            <Search className="w-5 h-5 text-mint mr-3 shrink-0" />
            <Command.Input
              placeholder="Search modules, tracks, certifications or quick actions..."
              className="w-full h-14 bg-transparent text-foreground placeholder:text-foreground/40 text-sm focus:outline-none"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex rounded border border-border bg-card-subtle px-1.5 py-0.5 text-[10px] font-mono text-foreground/50">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-96 overflow-y-auto p-2 space-y-2">
            <Command.Empty className="py-8 text-center text-sm text-foreground/50">
              No matching results found.
            </Command.Empty>

            {/* Quick Navigation */}
            <Command.Group heading="Navigation" className="text-xs font-semibold text-foreground/40 px-2 py-1">
              <Command.Item
                onSelect={() => handleSelect(() => router.push("/dashboard"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-card-subtle cursor-pointer transition-colors"
              >
                <Compass className="w-4 h-4 text-mint" />
                <span>Dashboard & Progress</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => router.push("/learn"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-card-subtle cursor-pointer transition-colors"
              >
                <BookOpen className="w-4 h-4 text-track-1" />
                <span>Curriculum Tracks</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => router.push("/certificates"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-card-subtle cursor-pointer transition-colors"
              >
                <Award className="w-4 h-4 text-track-2" />
                <span>Free Certificates Directory</span>
              </Command.Item>
              <Command.Item
                onSelect={() => handleSelect(() => router.push("/profile"))}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-card-subtle cursor-pointer transition-colors"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Profile & Achievements</span>
              </Command.Item>
            </Command.Group>

            {/* Modules by Track */}
            {tracks === null && !tracksFailed ? (
              <Command.Group
                heading="Live Curriculum"
                className="text-xs font-semibold text-foreground/40 px-2 py-1 pt-3"
              >
                <div className="px-3 py-2 text-sm text-foreground/50">
                  Loading curriculum…
                </div>
              </Command.Group>
            ) : tracksFailed ? (
              <Command.Group
                heading="Live Curriculum"
                className="text-xs font-semibold text-foreground/40 px-2 py-1 pt-3"
              >
                <div className="px-3 py-2 text-sm text-foreground/50">
                  The live curriculum is temporarily unavailable — close and reopen the palette to retry.
                </div>
              </Command.Group>
            ) : tracks && tracks.length > 0 ? (
              tracks.map((track) => (
              <Command.Group
                key={track.id}
                heading={`Track ${track.trackNumber}: ${track.title}`}
                className="text-xs font-semibold text-foreground/40 px-2 py-1 pt-3"
              >
                {track.modules.map((mod) => (
                  <Command.Item
                    key={mod.id}
                    onSelect={() =>
                      handleSelect(() =>
                        router.push(`/learn/${track.slug}/${mod.slug}`)
                      )
                    }
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-card-subtle cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {mod.hasGitVisualizer ? (
                        <GitBranch className="w-4 h-4 text-mint shrink-0" />
                      ) : (
                        <Terminal className="w-4 h-4 text-foreground/50 shrink-0" />
                      )}
                      <span>
                        {mod.order}. {mod.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-foreground/40">
                      {mod.estimatedMinutes}m
                    </span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))
            ) : (
              <Command.Group
                heading="Live Curriculum"
                className="text-xs font-semibold text-foreground/40 px-2 py-1 pt-3"
              >
                <div className="px-3 py-2 text-sm text-foreground/50">
                  No curriculum tracks available yet.
                </div>
              </Command.Group>
            )}

            {/* Quick System Actions */}
            <Command.Group heading="Actions & System" className="text-xs font-semibold text-foreground/40 px-2 py-1 pt-3">
              <Command.Item
                onSelect={() =>
                  handleSelect(() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                    showToast({
                      title: `Switched to ${theme === "dark" ? "light" : "dark"} mode`,
                      type: "info",
                    });
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/80 hover:text-foreground hover:bg-card-subtle cursor-pointer transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )}
                <span>Toggle Theme (Dark / Light)</span>
              </Command.Item>

              <Command.Item
                onSelect={() =>
                  handleSelect(async () => {
                    try {
                      await api.resetProgress();
                      // D5: XP stays client-side; resetting includes it.
                      resetXP();
                      showToast({
                        title: "Progress Reset",
                        description: "Server progress and local XP have been cleared.",
                        type: "success",
                      });
                      router.refresh();
                    } catch {
                      showToast({
                        title: "Reset failed",
                        description: "The progress reset could not be completed. Please try again.",
                        type: "error",
                      });
                    }
                  })
                }
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>Reset Progress</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

