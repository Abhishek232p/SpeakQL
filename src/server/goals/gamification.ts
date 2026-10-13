import type { DashboardCompetencyRecord, DashboardEvaluationRecord, DashboardExerciseRecord, DashboardScore } from "./repository";

export type GamificationAchievement = Readonly<{
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string | null;
  icon: string;
}>;

export type DashboardGamification = Readonly<{
  totalXp: number;
  streakDays: number;
  streakActiveToday: boolean;
  dailyGoal: Readonly<{
    targetXp: number;
    currentXp: number;
    completedActivities: number;
    percentage: number;
    achieved: boolean;
  }>;
  achievements: readonly GamificationAchievement[];
}>;

export const XP_RULES = {
  BASE_EXERCISE_COMPLETION: 20,
  MASTERY_BONUS: 10,
  REVIEW_PRACTICE_BONUS: 5,
  MAX_REVIEW_BONUS_PER_EXERCISE: 10,
  DEFAULT_DAILY_TARGET_XP: 30,
} as const;

function normalizeScore(score: string): DashboardScore {
  const normalized = score.trim().toLowerCase();
  if (normalized === "mastered") return "mastered";
  if (normalized === "needs_work") return "needs_work";
  return "unclassified";
}

function parseDateKey(value: Date | string | number | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10); // YYYY-MM-DD in UTC
}

/**
 * Calculates XP earned per exercise and total XP.
 * Prevents spamming duplicate submissions from artificially inflating XP:
 * - Base completion: 20 XP for the first valid evaluation on an exercise.
 * - Mastery bonus: +10 XP if the latest result is mastered.
 * - Additional review practice: +5 XP per review evaluation, capped at MAX_REVIEW_BONUS_PER_EXERCISE (10 XP).
 */
export function calculateXpBreakdown(
  exercises: readonly DashboardExerciseRecord[],
  evaluations: readonly DashboardEvaluationRecord[],
): { totalXp: number; exerciseXp: Map<string, number> } {
  const evaluationsByExercise = new Map<string, DashboardEvaluationRecord[]>();
  for (const ev of evaluations) {
    const list = evaluationsByExercise.get(ev.exerciseId) ?? [];
    list.push(ev);
    evaluationsByExercise.set(ev.exerciseId, list);
  }

  const exerciseXp = new Map<string, number>();
  let totalXp = 0;

  for (const ex of exercises) {
    const list = evaluationsByExercise.get(ex.id) ?? [];
    if (list.length === 0) continue;

    let xp = XP_RULES.BASE_EXERCISE_COMPLETION;

    // Check if latest score is mastered
    const latest = list.slice().sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })[0];

    if (latest && normalizeScore(latest.score) === "mastered") {
      xp += XP_RULES.MASTERY_BONUS;
    }

    // Additional review submissions capped to prevent runaway duplicate XP
    const reviewAttempts = Math.max(0, list.length - 1);
    const reviewBonus = Math.min(
      reviewAttempts * XP_RULES.REVIEW_PRACTICE_BONUS,
      XP_RULES.MAX_REVIEW_BONUS_PER_EXERCISE,
    );
    xp += reviewBonus;

    exerciseXp.set(ex.id, xp);
    totalXp += xp;
  }

  return { totalXp, exerciseXp };
}

/**
 * Calculates genuine consecutive practice streak from persisted activity timestamps.
 * A streak increases only across consecutive calendar dates (UTC policy).
 * A skipped day resets the streak.
 */
export function calculateStreak(
  evaluations: readonly DashboardEvaluationRecord[],
  referenceDate: Date = new Date(),
): { streakDays: number; streakActiveToday: boolean } {
  const activeDates = new Set<string>();
  for (const ev of evaluations) {
    const dateKey = parseDateKey(ev.createdAt);
    if (dateKey) activeDates.add(dateKey);
  }

  if (activeDates.size === 0) {
    return { streakDays: 0, streakActiveToday: false };
  }

  const todayKey = referenceDate.toISOString().slice(0, 10);
  const yesterday = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const streakActiveToday = activeDates.has(todayKey);

  // If neither today nor yesterday has activity, streak is broken
  if (!streakActiveToday && !activeDates.has(yesterdayKey)) {
    return { streakDays: 0, streakActiveToday: false };
  }

  // Count consecutive days backward starting from today (if practiced today) or yesterday
  let streakDays = 0;
  let cursor = streakActiveToday ? new Date(referenceDate) : yesterday;

  while (true) {
    const cursorKey = cursor.toISOString().slice(0, 10);
    if (activeDates.has(cursorKey)) {
      streakDays += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
    } else {
      break;
    }
  }

  return { streakDays, streakActiveToday };
}

/**
 * Calculates daily goal progress based on evaluations submitted today.
 */
export function calculateDailyGoal(
  evaluations: readonly DashboardEvaluationRecord[],
  targetXp: number = XP_RULES.DEFAULT_DAILY_TARGET_XP,
  referenceDate: Date = new Date(),
): { targetXp: number; currentXp: number; completedActivities: number; percentage: number; achieved: boolean } {
  const todayKey = referenceDate.toISOString().slice(0, 10);
  const todayEvaluations = evaluations.filter((ev) => parseDateKey(ev.createdAt) === todayKey);

  const completedActivities = todayEvaluations.length;
  // Each activity today earns base XP + bonus if mastered
  let currentXp = 0;
  for (const ev of todayEvaluations) {
    currentXp += XP_RULES.BASE_EXERCISE_COMPLETION;
    if (normalizeScore(ev.score) === "mastered") {
      currentXp += XP_RULES.MASTERY_BONUS;
    }
  }

  const percentage = Math.min(100, Math.round((currentXp / targetXp) * 100));
  const achieved = currentXp >= targetXp;

  return {
    targetXp,
    currentXp,
    completedActivities,
    percentage,
    achieved,
  };
}

/**
 * Computes verifiable gamification state from persisted database evidence.
 */
export function deriveGamification(
  evaluations: readonly DashboardEvaluationRecord[],
  exercises: readonly DashboardExerciseRecord[],
  competencies: readonly DashboardCompetencyRecord[],
  referenceDate: Date = new Date(),
): DashboardGamification {
  const { totalXp } = calculateXpBreakdown(exercises, evaluations);
  const { streakDays, streakActiveToday } = calculateStreak(evaluations, referenceDate);
  const dailyGoal = calculateDailyGoal(evaluations, XP_RULES.DEFAULT_DAILY_TARGET_XP, referenceDate);

  const masteredEvaluations = evaluations.filter((ev) => normalizeScore(ev.score) === "mastered");
  const hasMasteredCompetency = competencies.some((comp) => {
    const compExs = exercises.filter((ex) => ex.competencyId === comp.id);
    if (compExs.length === 0) return false;
    return compExs.every((ex) => {
      const exEvals = evaluations.filter((ev) => ev.exerciseId === ex.id);
      return exEvals.some((ev) => normalizeScore(ev.score) === "mastered");
    });
  });

  const achievements: GamificationAchievement[] = [
    {
      id: "first_words",
      title: "First Communication",
      description: "Submitted your first practice response and recorded baseline evidence.",
      unlocked: evaluations.length >= 1,
      unlockedAt: evaluations[0] ? parseDateKey(evaluations[0].createdAt) : null,
      icon: "🎯",
    },
    {
      id: "daily_target",
      title: "Daily Target Reached",
      description: `Earned ${XP_RULES.DEFAULT_DAILY_TARGET_XP}+ XP today through active practice.`,
      unlocked: dailyGoal.achieved,
      unlockedAt: dailyGoal.achieved ? referenceDate.toISOString().slice(0, 10) : null,
      icon: "⚡",
    },
    {
      id: "streak_starter",
      title: "Streak Starter",
      description: "Maintained active practice across 2 or more consecutive days.",
      unlocked: streakDays >= 2,
      icon: "🔥",
    },
    {
      id: "competency_master",
      title: "Competency Master",
      description: "Mastered all real-world exercises within a communication competency.",
      unlocked: hasMasteredCompetency,
      icon: "🏆",
    },
    {
      id: "communication_ace",
      title: "Fluency Builder",
      description: "Achieved mastered status on 2 or more distinct communication exercises.",
      unlocked: masteredEvaluations.length >= 2,
      icon: "⭐",
    },
  ];

  return {
    totalXp,
    streakDays,
    streakActiveToday,
    dailyGoal,
    achievements,
  };
}
