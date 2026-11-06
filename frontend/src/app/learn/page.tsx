"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { api } from "@/lib/api/api-client";
import type { ModuleMeta, Track } from "@/lib/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Layers,
  Cpu,
  ArrowRight,
  Clock,
  BookOpen,
  GitBranch,
  CheckCircle2,
  Lock,
  Zap,
} from "lucide-react";

const ICONS = { Globe, Layers, Cpu };

function ModuleCard({
  mod,
  track,
  idx,
}: {
  mod: ModuleMeta;
  track: Track;
  idx: number;
}) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const accentColor = {
    mint: "group-hover:text-mint group-hover:border-mint/40",
    blue: "group-hover:text-track-1 group-hover:border-track-1/40",
    amber: "group-hover:text-track-2 group-hover:border-track-2/40",
  }[track.color];

  return (
    <motion.a
      ref={ref}
      href={`/learn/${track.slug}/${mod.slug}`}
      initial={{ opacity: 0, y: 14 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: idx * 0.04, ease: [0.23, 1, 0.32, 1] }}
      className={`group p-4 rounded-2xl border border-border/70 bg-slate-50 dark:bg-ink-950/40 hover:bg-slate-100 dark:hover:bg-card-subtle transition-all duration-200 flex flex-col justify-between shadow-sm ${accentColor}`}
    >
      <div>
        <div className="flex items-center justify-between text-[11px] text-foreground/45 mb-1.5 font-mono">
          <span>Module 0{track.trackNumber}.{mod.order}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-mint" /> {mod.estimatedMinutes}m
          </span>
        </div>

        <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-inherit transition-colors">
          {mod.title}
        </h4>

        <p className="text-xs text-foreground/55 line-clamp-2 mt-1 leading-relaxed">
          {mod.description}
        </p>
      </div>

      <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
        {mod.hasGitVisualizer ? (
          <span className="text-mint font-medium flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> Live DAG Tool
          </span>
        ) : (
          <span className="text-foreground/35">Mastery Quiz</span>
        )}
        <ArrowRight className="w-3 h-3 text-foreground/35 group-hover:text-inherit group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.a>
  );
}

export default function LearnPage() {
  // Phase 4: real DB-backed learning content via the BFF (no silent mock
  // fallback — failures show an explicit retry panel).
  const [tracks, setTracks] = React.useState<Track[] | null>(null);
  const [tracksFailed, setTracksFailed] = React.useState(false);

  const loadTracks = React.useCallback(() => {
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
        if (!cancelled) setTracksFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => loadTracks(), [loadTracks]);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3 py-1 text-xs text-mint font-mono">
          <span>CURRICULUM OVERVIEW</span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
          Engineering Learning Tracks
        </h1>
        <p className="text-base sm:text-lg text-foreground/65 leading-relaxed">
          From the physical layer of networking through full-stack web applications to decentralized smart contract engineering.
        </p>
      </motion.div>

      {/* ── Track Cards ── */}
      <div className="space-y-14">
        {tracksFailed ? (
          <div className="text-center space-y-4 py-12">
            <p className="text-sm text-foreground/60 font-mono">
              The live curriculum is temporarily unavailable. Please try again.
            </p>
            <Button variant="outline" onClick={loadTracks}>
              Retry
            </Button>
          </div>
        ) : !tracks ? (
          <>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-64 rounded-3xl border border-border bg-card/60 animate-pulse"
                aria-hidden
              />
            ))}
          </>
        ) : (
          tracks.map((track, trackIdx) => {
          const Icon = ICONS[track.icon as keyof typeof ICONS] || Globe;
          const accent = {
            mint:  { border: "border-mint/20",    text: "text-mint",    bg: "bg-mint/10",    badgeBorder: "border-mint/30",    iconColor: "#5EEAD4" },
            blue:  { border: "border-track-1/20", text: "text-track-1", bg: "bg-track-1/10", badgeBorder: "border-track-1/30", iconColor: "#8AB4FF" },
            amber: { border: "border-track-2/20", text: "text-track-2", bg: "bg-track-2/10", badgeBorder: "border-track-2/30", iconColor: "#F5B14C" },
          }[track.color];

          return (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: trackIdx * 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg"
            >
              {/* Track Banner */}
              <div className="p-6 sm:p-8 border-b border-border bg-card-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-2xl border shrink-0"
                    style={{ borderColor: `${accent.iconColor}40`, background: `${accent.iconColor}15` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: accent.iconColor }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-xs uppercase font-semibold text-foreground/45">
                        Track 0{track.trackNumber}
                      </span>
                      <span className="text-foreground/25">•</span>
                      <Badge variant={track.color} className="text-[10px]">
                        {track.level}
                      </Badge>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-foreground">{track.title}</h2>
                    <p className="text-xs sm:text-sm text-foreground/55 mt-1 max-w-xl">{track.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 shrink-0 w-full md:w-auto">
                  <div className="text-right hidden sm:block">
                    <span className="font-display text-lg font-bold text-foreground">
                      {track.moduleCount} Modules
                    </span>
                    <p className="text-xs text-foreground/45 font-mono">~{track.estimatedHours} hrs total</p>
                    <p className="text-xs text-track-1 font-mono font-bold mt-0.5">
                      +{track.moduleCount * 200} XP available
                    </p>
                  </div>
                  <Link href={`/learn/${track.slug}`} className="w-full md:w-auto">
                    <Button variant="primary" size="md" className="w-full font-semibold">
                      Open Learning Trail <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Modules Grid */}
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/45 font-mono">
                    Modules in this track
                  </h3>
                  <span className="text-[11px] font-mono text-foreground/35">
                    {track.modules.length} total
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {track.modules.map((mod, modIdx) => (
                    <ModuleCard key={mod.id} mod={mod} track={track} idx={modIdx} />
                  ))}
                </div>
              </div>
            </motion.div>
          );
          })
        )}
      </div>
    </div>
  );
}
