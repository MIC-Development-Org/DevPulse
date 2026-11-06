"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { HeroCanvas } from "@/components/landing/hero-canvas";
import { InteractiveHeroShowcase } from "@/components/landing/interactive-hero-showcase";
import { GitVisualizer } from "@/components/interactive/git-visualizer";
import { MarqueeTicker } from "@/components/landing/marquee-ticker";
import { BentoFeatures } from "@/components/landing/bento-features";
import { StepsJourney } from "@/components/landing/steps-journey";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/api-client";
import type { Track } from "@/lib/contracts";
import {
  ArrowRight,
  Terminal,
  Layers,
  Cpu,
  Globe,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  Flame,
  Award,
  BookOpen,
  ChevronDown,
} from "lucide-react";

// ─── Animated counter on scroll ──────────────────────────────────────────────
function CounterMetric({
  target,
  suffix = "",
  label,
  accent = "text-mint",
}: {
  target: number | string;
  suffix?: string;
  label: string;
  accent?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [displayed, setDisplayed] = React.useState<string | number>(
    typeof target === "number" ? 0 : target
  );

  React.useEffect(() => {
    if (!isInView || typeof target !== "number") return;
    const duration = 1200;
    const steps = 40;
    const inc = target / steps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      setDisplayed(Math.min(Math.round(inc * step), target));
      if (step >= steps) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [isInView, target]);

  return (
    <div ref={ref} className="flex flex-col items-start">
      <span className={`font-display text-2xl sm:text-3xl font-black ${accent}`}>
        {typeof target === "number" ? displayed : target}{suffix}
      </span>
      <span className="text-xs text-foreground/55 font-mono mt-0.5">{label}</span>
    </div>
  );
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const initial = {
    up: { opacity: 0, y: 32 },
    left: { opacity: 0, x: -32 },
    right: { opacity: 0, x: 32 },
    none: { opacity: 0 },
  }[direction];

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ duration: 0.55, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Track card ───────────────────────────────────────────────────────────────
function TrackCard({ track, index }: { track: Track; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [hovered, setHovered] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const glowMap = {
    mint: { hover: "hover:border-mint/50 hover:shadow-[0_0_50px_-8px_rgba(94,234,212,0.25)]", accent: "from-mint/10", text: "text-mint", badgeAccent: "#5EEAD4" },
    blue: { hover: "hover:border-track-1/50 hover:shadow-[0_0_50px_-8px_rgba(138,180,255,0.25)]", accent: "from-track-1/10", text: "text-track-1", badgeAccent: "#8AB4FF" },
    amber: { hover: "hover:border-track-2/50 hover:shadow-[0_0_50px_-8px_rgba(245,177,76,0.25)]", accent: "from-track-2/10", text: "text-track-2", badgeAccent: "#F5B14C" },
  }[track.color];

  const icons = { Globe, Layers, Cpu };
  const Icon = icons[track.icon as keyof typeof icons] || Globe;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl border border-border bg-card/80 backdrop-blur-md transition-all duration-300 overflow-hidden ${glowMap.hover}`}
    >
      {/* Spotlight follow */}
      {hovered && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: 260,
            height: 260,
            left: mousePos.x - 130,
            top: mousePos.y - 130,
            background: `radial-gradient(circle, ${glowMap.badgeAccent}18, transparent 70%)`,
            transition: "opacity 0.15s",
          }}
        />
      )}

      {/* Top gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${glowMap.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-xl border"
            style={{ borderColor: `${glowMap.badgeAccent}40`, background: `${glowMap.badgeAccent}15` }}
          >
            <Icon className="w-5 h-5" style={{ color: glowMap.badgeAccent }} />
          </div>
          <span className="font-mono text-xs text-foreground/45">Track 0{track.trackNumber}</span>
        </div>

        <div>
          <h3 className="font-display text-xl font-bold text-foreground">{track.title}</h3>
          <p className={`text-xs font-medium mt-0.5 ${glowMap.text}`}>{track.subtitle}</p>
        </div>

        <p className="text-xs sm:text-sm text-foreground/65 leading-relaxed">{track.description}</p>

        <ul className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-foreground/55">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0" />
            <span>{track.moduleCount} interactive modules</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0" />
            <span>~{track.estimatedHours} hours structured learning</span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-mint shrink-0" />
            <span>Mastery quiz gate — 80% passing standard</span>
          </li>
        </ul>
      </div>

      <div className="pt-6 relative z-10">
        <Link href={`/learn/${track.slug}`} className="block">
          <Button variant="secondary" className="w-full text-xs font-semibold justify-between group-hover:border-inherit">
            <span>Explore Track Path</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  // Phase 4: real DB-backed curriculum via the BFF. No silent mock fallback —
  // failures surface as an explicit inline panel with a retry.
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

  // Target-based progress: fade is anchored to the hero section itself, so
  // content stays fully visible until the hero actually leaves the viewport.
  const heroRef = React.useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  // Only begin dissolving once the hero is ~45% scrolled away, and never reach 0
  // — this guarantees the section never renders as a blank void.
  const heroOpacityRaw = useTransform(heroProgress, [0.45, 0.95], [1, 0.1]);
  const heroYRaw = useTransform(heroProgress, [0, 1], [0, -70]);
  const heroScaleRaw = useTransform(heroProgress, [0, 1], [1, 0.97]);
  const smoothOpacity = useSpring(heroOpacityRaw, { stiffness: 120, damping: 30 });
  const smoothY = useSpring(heroYRaw, { stiffness: 100, damping: 30 });
  const smoothScale = useSpring(heroScaleRaw, { stiffness: 100, damping: 30 });
  // Scroll hint disappears almost immediately once movement starts.
  const hintOpacity = useTransform(heroProgress, [0, 0.12], [1, 0]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">

      {/* ─── 1. CINEMATIC HERO ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative pt-20 pb-24 md:pt-28 md:pb-36 px-4 sm:px-6 lg:px-8 border-b border-border bg-aurora hex-grid-pattern min-h-[92vh] flex items-center"
      >
        <HeroCanvas />

        <motion.div
          style={{ opacity: smoothOpacity, y: smoothY, scale: smoothScale }}
          className="relative z-10 max-w-5xl mx-auto text-center space-y-8 w-full"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/5 px-4 py-1.5 text-xs font-mono text-mint backdrop-blur-md shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>MIC DEVELOPMENT 2026-27</span>
            <span className="text-foreground/30 hidden sm:inline">•</span>
            <span className="hidden sm:inline">TEAM 5 ENGINEERING INITIATIVE</span>
          </motion.div>

          {/* H1 with staggered word reveal */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="font-display text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.06] max-w-4xl mx-auto"
          >
            {"From packet transport to ".split(" ").filter(Boolean).map((word, i) => (
              <React.Fragment key={i}>
                <motion.span
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.06 }}
                  className="inline-block"
                >
                  {word}
                </motion.span>
                {" "}
              </React.Fragment>
            ))}
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.65 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-mint via-track-1 to-track-2 inline"
            >
              audited smart contracts.
            </motion.span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.45 }}
            className="text-base sm:text-xl text-foreground/65 max-w-2xl mx-auto leading-relaxed"
          >
            The engineering curriculum built for rigor. Master the physical internet, React Fiber internals, relational database tuning, and EVM opcodes — with interactive DAG tooling and server-verified quizzes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/learn" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto px-8 font-semibold shadow-[0_0_30px_-6px_rgba(94,234,212,0.5)] hover:shadow-[0_0_40px_-4px_rgba(94,234,212,0.7)] transition-shadow"
              >
                Explore Curriculum <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/learn/web-foundations/git-basics" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto px-7">
                <Terminal className="w-4 h-4 mr-2 text-mint" />
                Launch Git Visualiser
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.4 }}
            className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { target: 23, suffix: "",    label: "Deep-Dive Modules", accent: "text-teal-700 dark:text-mint" },
              { target: "80", suffix: "%", label: "Pass Mark Gate",     accent: "text-blue-700 dark:text-track-1" },
              { target: "100",suffix: "%", label: "Free Certificates",  accent: "text-amber-700 dark:text-track-2" },
              { target: "WCAG",suffix:"",  label: "2.2 AA Verified",    accent: "text-emerald-700 dark:text-emerald-400" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.04 }}
                className="p-4 rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm shadow-sm hover:border-mint/30 transition-all duration-200 text-left"
              >
                <CounterMetric target={stat.target as number} suffix={stat.suffix} label={stat.label} accent={stat.accent} />
              </motion.div>
            ))}
          </motion.div>

          {/* Interactive showcase */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="pt-4 space-y-3"
          >
            <p className="flex items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-foreground/40">
              <span className="h-1.5 w-1.5 rounded-full bg-mint animate-pulse" aria-hidden="true" />
              Live demo — click any tab to explore
            </p>
            <InteractiveHeroShowcase />
          </motion.div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ opacity: hintOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-foreground/30 z-10"
          aria-hidden="true"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* ─── 1.5 TOPIC TICKER — instant visual life as you leave the hero ──── */}
      <MarqueeTicker />

      {/* ─── 2. THREE-TRACK JOURNEY ────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Reveal>
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
            <Badge variant="mint" className="text-xs uppercase font-mono tracking-wider">
              Curriculum Architecture
            </Badge>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              A cohesive three-stage trajectory
            </h2>
            <p className="text-sm sm:text-base text-foreground/60">
              No isolated toy projects. Each track provides foundational primitives for the next.
            </p>
          </div>
        </Reveal>

        {tracksFailed ? (
          <div className="text-center space-y-4 py-10">
            <p className="text-sm text-foreground/60 font-mono">
              The live curriculum is temporarily unavailable. Please try again.
            </p>
            <Button variant="outline" onClick={loadTracks}>
              Retry
            </Button>
          </div>
        ) : !tracks ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-72 rounded-3xl border border-border bg-card/60 animate-pulse"
                aria-hidden
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ─── 2.5 PLATFORM SUPERPOWERS (bento grid) ────────────────────────── */}
      <BentoFeatures />

      {/* ─── 2.75 THE JOURNEY (3-step strip) ──────────────────────────────── */}
      <StepsJourney />

      {/* ─── 3. GIT VISUALISER SHOWCASE ───────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 border-t border-border">
        <Reveal>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="mint" className="text-xs font-mono">
              Interactive Craft Demo
            </Badge>
            <h2 className="font-display text-3xl font-bold text-foreground tracking-tight">
              Learn with living tools, not static slides
            </h2>
            <p className="text-sm text-foreground/60">
              Experiment with Git branches, commits, and 3-way merges directly below. Watch the DAG graph react in real-time.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <GitVisualizer />
        </Reveal>
      </section>

      {/* ─── 4. COMPARISON MATRIX ─────────────────────────────────────────── */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 border-t border-border">
        <Reveal>
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <Badge variant="blue" className="text-xs font-mono">Direct Comparison</Badge>
            <h2 className="font-display text-3xl font-bold text-foreground tracking-tight">Why DevPulse exists</h2>
            <p className="text-sm text-foreground/60">How DevPulse sets a new standard over legacy subscription platforms.</p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-lg">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-border bg-card-subtle text-foreground font-display font-semibold">
                <tr>
                  <th className="p-4 sm:p-5">Platform Dimension</th>
                  <th className="p-4 sm:p-5 text-teal-700 dark:text-mint font-bold">DevPulse (MIC Team 5)</th>
                  <th className="p-4 sm:p-5 text-foreground/45">Legacy Video Sites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground/75">
                {[
                  ["Content Format", "Document-first MDX + Interactive DAG tools + Official video cards", "Passive 40-hour video autoplay loops"],
                  ["Mastery Verification", "Server-side scored 80% threshold with concept explanations", "Click 'Next Video' with zero verification"],
                  ["Git & Tooling", "Live in-browser DAG graph with terminal simulation", "Slide screenshots without interactive feedback"],
                  ["Certifications", "Curated free industry credentials paired directly to curriculum", "Proprietary walled-garden certificates locked behind subscriptions"],
                ].map(([dim, devpulse, legacy]) => (
                  <tr key={dim} className="hover:bg-slate-50 dark:hover:bg-ink-950/40 transition-colors">
                    <td className="p-4 sm:p-5 font-medium text-foreground">{dim}</td>
                    <td className="p-4 sm:p-5 text-teal-700 dark:text-mint font-semibold">{devpulse}</td>
                    <td className="p-4 sm:p-5 text-foreground/45">{legacy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ─── 5. BOTTOM CTA ────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-border bg-slate-50 dark:bg-ink-950/60 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-aurora opacity-40 pointer-events-none" />
        {/* Decorative orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-mint/5 blur-3xl pointer-events-none" />

        <Reveal>
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
              Start building with genuine understanding.
            </h2>
            <p className="text-sm sm:text-base text-foreground/65 max-w-xl mx-auto leading-relaxed">
              Begin with Track 0 Web Foundations or dive straight into modern Full-Stack and Blockchain architectures.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/learn/web-foundations">
                <Button size="lg" variant="primary" className="px-8 font-semibold shadow-lg">
                  Start Track 0 (Web Foundations) <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="px-7">
                  View Student Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
