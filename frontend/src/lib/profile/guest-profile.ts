import type { UserProfile } from "@/lib/contracts";

/**
 * Zeroed profile for GUESTS (approved Phase 5 decision D1).
 *
 * Public pages (track overview / trail) render real DB content but must show
 * REAL zero progress for unauthenticated visitors — never the mock user's
 * progress and never a fabricated identity. The learning trail force-unlocks
 * the first module on its own; nothing else is granted here.
 */
export function zeroedUserProfile(): UserProfile {
  return {
    id: "",
    name: "Guest",
    username: "guest",
    email: "",
    avatarUrl: "",
    streakDays: 0,
    completedModuleIds: [],
    unlockedModuleIds: [],
    currentModuleId: "",
    quizScores: {},
    weeklyActivity: {},
    badges: [],
  };
}
