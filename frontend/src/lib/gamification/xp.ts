/**
 * XP & Level System for DevPulse gamification layer.
 * All state persisted to localStorage; swapping to backend requires
 * only changing the read/write functions below.
 */

export const XP_EVENTS = {
  MODULE_READ: 50,
  QUIZ_PASS: 200,
  QUIZ_PERFECT: 500, // 100%
  STREAK_MAINTAINED: 30,
  FIRST_MODULE: 100,
  TRACK_COMPLETE: 1000,
} as const;

export interface LevelDefinition {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: "Initiate",         minXP: 0,    maxXP: 199,   color: "#94A3B8" },
  { level: 2, title: "Explorer",         minXP: 200,  maxXP: 499,   color: "#5EEAD4" },
  { level: 3, title: "Builder",          minXP: 500,  maxXP: 999,   color: "#5EEAD4" },
  { level: 4, title: "Developer",        minXP: 1000, maxXP: 1799,  color: "#8AB4FF" },
  { level: 5, title: "Engineer",         minXP: 1800, maxXP: 2999,  color: "#8AB4FF" },
  { level: 6, title: "Architect",        minXP: 3000, maxXP: 4499,  color: "#F5B14C" },
  { level: 7, title: "Protocol Expert",  minXP: 4500, maxXP: 6499,  color: "#F5B14C" },
  { level: 8, title: "Chain Builder",    minXP: 6500, maxXP: 9999,  color: "#A78BFA" },
  { level: 9, title: "Auditor",          minXP: 10000,maxXP: 14999, color: "#F472B6" },
  { level: 10, title: "MIC Graduate",   minXP: 15000,maxXP: Infinity, color: "#FFD700" },
];

export interface XPState {
  totalXP: number;
  level: number;
  levelTitle: string;
  levelColor: string;
  progressInLevel: number; // 0-100
  xpToNextLevel: number;
  xpEarnedToday: number;
}

const STORAGE_KEY = "devpulse_xp";

function getStoredXP(): number {
  if (typeof window === "undefined") return 850; // SSR fallback: level 3
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 850;
    return JSON.parse(raw) as number;
  } catch {
    return 850;
  }
}

function storeXP(xp: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(xp));
  } catch {
    // localStorage unavailable
  }
}

export function getLevelForXP(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function computeXPState(totalXP: number): XPState {
  const current = getLevelForXP(totalXP);
  const next = LEVELS[current.level] ?? null; // level is 1-indexed, array is 0-indexed

  const rangeSize = next ? next.minXP - current.minXP : 1;
  const progressInRange = totalXP - current.minXP;
  const progressInLevel = next
    ? Math.min(100, Math.round((progressInRange / rangeSize) * 100))
    : 100;
  const xpToNextLevel = next ? next.minXP - totalXP : 0;

  return {
    totalXP,
    level: current.level,
    levelTitle: current.title,
    levelColor: current.color,
    progressInLevel,
    xpToNextLevel,
    xpEarnedToday: 0, // Would come from server in real app
  };
}

export function readXPState(): XPState {
  return computeXPState(getStoredXP());
}

export function addXP(amount: number): XPState {
  const current = getStoredXP();
  const next = current + amount;
  storeXP(next);
  return computeXPState(next);
}

/**
 * Phase 5: progress reset also clears local XP (D5 — XP stays client-side,
 * so a full "reset progress" is only honest when the local level goes too).
 * Returns the post-reset state (default SSR fallback level).
 */
export function resetXP(): XPState {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  }
  return computeXPState(getStoredXP());
}

