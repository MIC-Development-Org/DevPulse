import type { Badge } from "@devpulse/contracts";

/**
 * Badge catalog (Phase 5) — frontend-curated editorial definitions, moved out
 * of the frontend mock user so the backend profile composer and any future
 * frontend surface read the SAME catalog (single source of truth, like
 * TRACKS and QUIZ_BANKS).
 *
 * SCOPE RULE (approved Phase 5 decision D4): badges are NOT migrated to
 * server-side gamification logic. The composer attaches `unlockedAt` only
 * for the ONE mechanically derivable badge (Genesis Commit = first module
 * completed); every other catalog entry ships with `unlockedAt: null` until
 * its gamification rule ships in a later phase. No fake unlock dates — ever.
 */
export const BADGES: Badge[] = [
  {
    id: "badge-genesis",
    title: "Genesis Commit",
    description: "Enrolled in DevPulse and completed first module",
    icon: "Sparkles",
    unlockedAt: null, // derived: first COMPLETED module timestamp
  },
  {
    id: "badge-networking",
    title: "Packet Master",
    description: "Achieved 100% on TCP/TLS and HTTP Deep Dive quizzes",
    icon: "Wifi",
    trackId: "track-0",
    unlockedAt: null, // rule ships in a later phase
  },
  {
    id: "badge-streak-14",
    title: "Fortnight Fire",
    description: "Maintained an active 14-day study streak",
    icon: "Flame",
    unlockedAt: null, // rule ships in a later phase
  },
  {
    id: "badge-git-surgeon",
    title: "Git Surgeon",
    description: "Complete Git Basics module and pass quiz on first try",
    icon: "GitBranch",
    trackId: "track-0",
    unlockedAt: null, // rule ships in a later phase
  },
  {
    id: "badge-fiber-architect",
    title: "Fiber Architect",
    description: "Score 90%+ on React Architecture & Internals quiz",
    icon: "Atom",
    trackId: "track-1",
    unlockedAt: null, // rule ships in a later phase
  },
  {
    id: "badge-evm-auditor",
    title: "EVM Auditor",
    description: "Complete all Smart Contract Security challenges",
    icon: "ShieldCheck",
    trackId: "track-2",
    unlockedAt: null, // rule ships in a later phase
  },
];
