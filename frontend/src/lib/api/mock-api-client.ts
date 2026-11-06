import type {
  Track,
  ModuleMeta,
  QuizQuestion,
  QuizSubmission,
  QuizResult,
  CertificateResource,
  UserProfile,
  TopicBreakdown,
  MissedTopic,
} from "../contracts";
import {
  TRACKS,
  QUIZ_BANKS,
  CERTIFICATES,
  MOCK_USER,
  QUIZ_CONFIG,
} from "../data/mock-data";
import type { ApiClient } from "./api-client";
// In-browser mock adapter with LocalStorage persistence so progress and quiz scores stick across page reloads
export class MockApiClient implements ApiClient {
  private userKey = "devpulse_user_profile_v1";

  private getStoredUser(): UserProfile {
    if (typeof window === "undefined") return MOCK_USER;
    try {
      const stored = localStorage.getItem(this.userKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return MOCK_USER;
  }

  private saveStoredUser(user: UserProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch {
      // Ignore
    }
  }

  async getTracks(): Promise<Track[]> {
    return TRACKS;
  }

  async getTrackBySlug(slug: string): Promise<Track | null> {
    const track = TRACKS.find((t) => t.slug === slug);
    return track || null;
  }

  async getModuleBySlug(trackSlug: string, moduleSlug: string): Promise<ModuleMeta | null> {
    const track = TRACKS.find((t) => t.slug === trackSlug);
    if (!track) return null;
    const mod = track.modules.find((m) => m.slug === moduleSlug);
    return mod || null;
  }

  async getUserProfile(): Promise<UserProfile> {
    return this.getStoredUser();
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = this.getStoredUser();
    const updated = { ...current, ...updates };
    this.saveStoredUser(updated);
    return updated;
  }

  async resetProgress(): Promise<UserProfile> {
    this.saveStoredUser(MOCK_USER);
    return MOCK_USER;
  }

  async getQuizQuestions(moduleId: string): Promise<Omit<QuizQuestion, "correctOptionIndex">[]> {
    // Look up question bank for the module, or generate dynamic questions
    let bank = QUIZ_BANKS[moduleId];
    if (!bank || bank.length === 0) {
      // Fallback to git-basics bank or react bank for demonstration
      bank = QUIZ_BANKS["mod-0-5"] || [];
    }

    // Shuffle and pick config amount (default 8)
    const shuffled = [...bank].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, QUIZ_CONFIG.questionsPerAttempt);

    // SECURITY: Strip correctOptionIndex so client cannot cheat!
    return selected.map(({ correctOptionIndex, ...safeQuestion }) => safeQuestion);
  }

  async submitQuiz(submission: QuizSubmission): Promise<QuizResult> {
    // SERVER-SIDE SCORING SIMULATION (owned by M3)
    let bank = QUIZ_BANKS[submission.moduleId];
    if (!bank || bank.length === 0) {
      bank = QUIZ_BANKS["mod-0-5"] || [];
    }

    const questionMap = new Map<string, QuizQuestion>();
    bank.forEach((q) => questionMap.set(q.id, q));

    let score = 0;
    const topicStats: Record<string, { total: number; correct: number }> = {};
    const missedTopics: MissedTopic[] = [];

    const answeredQuestions = Object.entries(submission.answers);
    const totalQuestions = answeredQuestions.length > 0 ? answeredQuestions.length : QUIZ_CONFIG.questionsPerAttempt;

    for (const [qId, selectedOption] of answeredQuestions) {
      const question = questionMap.get(qId);
      if (!question) continue;

      if (!topicStats[question.topic]) {
        topicStats[question.topic] = { total: 0, correct: 0 };
      }
      topicStats[question.topic].total += 1;

      if (selectedOption === question.correctOptionIndex) {
        score += 1;
        topicStats[question.topic].correct += 1;
      } else {
        missedTopics.push({
          topic: question.topic,
          explanation: question.explanation,
          reviewConcept: `Review: ${question.question}`,
        });
      }
    }

    const percentage = Math.round((score / totalQuestions) * 100);
    const passed = percentage >= QUIZ_CONFIG.passPercentage;

    const topicBreakdown: TopicBreakdown[] = Object.entries(topicStats).map(
      ([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        percentage: Math.round((stats.correct / stats.total) * 100),
      })
    );

    // Find next module to unlock if passed
    let unlockedNextModuleId: string | null = null;
    if (passed) {
      let foundCurrent = false;
      for (const track of TRACKS) {
        for (const mod of track.modules) {
          if (foundCurrent) {
            unlockedNextModuleId = mod.id;
            break;
          }
          if (mod.id === submission.moduleId) {
            foundCurrent = true;
          }
        }
        if (unlockedNextModuleId) break;
      }

      // Persist unlock in user profile
      const user = this.getStoredUser();
      const completedSet = new Set(user.completedModuleIds);
      completedSet.add(submission.moduleId);

      const unlockedSet = new Set(user.unlockedModuleIds);
      if (unlockedNextModuleId) {
        unlockedSet.add(unlockedNextModuleId);
      }

      const updatedUser: UserProfile = {
        ...user,
        completedModuleIds: Array.from(completedSet),
        unlockedModuleIds: Array.from(unlockedSet),
        currentModuleId: unlockedNextModuleId || user.currentModuleId,
        quizScores: {
          ...user.quizScores,
          [submission.moduleId]: Math.max(
            user.quizScores[submission.moduleId] || 0,
            percentage
          ),
        },
      };
      this.saveStoredUser(updatedUser);
    }

    return {
      submissionId: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      moduleId: submission.moduleId,
      score,
      totalQuestions,
      percentage,
      passed,
      passMarkPercentage: QUIZ_CONFIG.passPercentage,
      topicBreakdown,
      missedTopics,
      unlockedNextModuleId,
      message: passed
        ? `Outstanding work! You scored ${percentage}% (pass mark is ${QUIZ_CONFIG.passPercentage}%). The next module has been unlocked!`
        : `You scored ${percentage}%, just below the ${QUIZ_CONFIG.passPercentage}% pass mark. Review the missed concepts below and retry with confidence!`,
    };
  }

  async getCertificates(): Promise<CertificateResource[]> {
    return CERTIFICATES;
  }
}

