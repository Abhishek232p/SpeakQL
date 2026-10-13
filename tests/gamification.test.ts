import { describe, expect, it } from "vitest";
import {
  calculateDailyGoal,
  calculateStreak,
  calculateXpBreakdown,
  deriveGamification,
  XP_RULES,
} from "@/src/server/goals/gamification";
import type { DashboardCompetencyRecord, DashboardEvaluationRecord, DashboardExerciseRecord } from "@/src/server/goals/repository";

const mockExercises: DashboardExerciseRecord[] = [
  { id: "ex-1", competencyId: "comp-1", scenarioPrompt: "Ex 1", expectedStructure: "Exp 1" },
  { id: "ex-2", competencyId: "comp-1", scenarioPrompt: "Ex 2", expectedStructure: "Exp 2" },
  { id: "ex-3", competencyId: "comp-2", scenarioPrompt: "Ex 3", expectedStructure: "Exp 3" },
];

const mockCompetencies: DashboardCompetencyRecord[] = [
  { id: "comp-1", goalId: "goal-1", description: "Standup status", status: "pending" },
  { id: "comp-2", goalId: "goal-1", description: "Coordination", status: "pending" },
];

describe("Gamification: XP Calculation & Duplicate Submission Protection", () => {
  it("awards 20 base XP for completed exercise and +10 XP bonus for mastery", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-12T10:00:00.000Z" },
    ];

    const result = calculateXpBreakdown(mockExercises, evaluations);
    expect(result.totalXp).toBe(30); // 20 base + 10 mastery
    expect(result.exerciseXp.get("ex-1")).toBe(30);
  });

  it("awards 20 base XP for needs_work evaluation without mastery bonus", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:00:00.000Z" },
    ];

    const result = calculateXpBreakdown(mockExercises, evaluations);
    expect(result.totalXp).toBe(20);
    expect(result.exerciseXp.get("ex-1")).toBe(20);
  });

  it("caps repeated submissions on the same exercise to prevent runaway XP inflation", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:05:00.000Z" },
      { id: "ev-3", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:10:00.000Z" },
      { id: "ev-4", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:15:00.000Z" },
      { id: "ev-5", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:20:00.000Z" },
    ];

    const result = calculateXpBreakdown(mockExercises, evaluations);
    // Base 20 + max review bonus capped at 10 = 30 total
    expect(result.totalXp).toBe(30);
    expect(result.exerciseXp.get("ex-1")).toBe(30);
  });
});

describe("Gamification: Streak Calculation across Date Boundaries", () => {
  const today = new Date("2026-10-12T12:00:00.000Z");

  it("calculates 1-day streak when practiced today", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-12T08:00:00.000Z" },
    ];

    const result = calculateStreak(evaluations, today);
    expect(result.streakDays).toBe(1);
    expect(result.streakActiveToday).toBe(true);
  });

  it("calculates 3-day streak across consecutive calendar dates", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-10T14:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-2", score: "mastered", createdAt: "2026-10-11T09:00:00.000Z" },
      { id: "ev-3", exerciseId: "ex-3", score: "mastered", createdAt: "2026-10-12T10:00:00.000Z" },
    ];

    const result = calculateStreak(evaluations, today);
    expect(result.streakDays).toBe(3);
    expect(result.streakActiveToday).toBe(true);
  });

  it("preserves yesterday's streak if learner has not yet practiced today", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-10T14:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-2", score: "mastered", createdAt: "2026-10-11T09:00:00.000Z" },
    ];

    const result = calculateStreak(evaluations, today);
    expect(result.streakDays).toBe(2);
    expect(result.streakActiveToday).toBe(false);
  });

  it("resets streak to 0 if a full day was skipped", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-09T14:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-2", score: "mastered", createdAt: "2026-10-10T09:00:00.000Z" },
      // Skipped 2026-10-11!
    ];

    const result = calculateStreak(evaluations, today);
    expect(result.streakDays).toBe(0);
    expect(result.streakActiveToday).toBe(false);
  });
});

describe("Gamification: Daily Goal & Achievements", () => {
  const today = new Date("2026-10-12T12:00:00.000Z");

  it("tracks daily goal progress and achievement status", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-12T08:00:00.000Z" },
    ];

    const daily = calculateDailyGoal(evaluations, XP_RULES.DEFAULT_DAILY_TARGET_XP, today);
    expect(daily.completedActivities).toBe(1);
    expect(daily.currentXp).toBe(30); // 20 + 10 mastered
    expect(daily.achieved).toBe(true);
    expect(daily.percentage).toBe(100);
  });

  it("unlocks verifiable achievements only when genuine conditions are met", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-11T08:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-2", score: "mastered", createdAt: "2026-10-12T08:00:00.000Z" },
    ];

    const gamification = deriveGamification(evaluations, mockExercises, mockCompetencies, today);
    const achievementsById = new Map(gamification.achievements.map((a) => [a.id, a]));

    expect(achievementsById.get("first_words")?.unlocked).toBe(true);
    expect(achievementsById.get("daily_target")?.unlocked).toBe(true);
    expect(achievementsById.get("streak_starter")?.unlocked).toBe(true);
    expect(achievementsById.get("competency_master")?.unlocked).toBe(true); // ex-1 & ex-2 both mastered for comp-1
  });
});
