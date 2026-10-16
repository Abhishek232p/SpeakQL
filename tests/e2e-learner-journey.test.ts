import { describe, expect, it } from "vitest";
import { generateGoalCurriculum, parseExerciseDetails } from "@/src/server/goals/curriculum";
import { createEvaluationBoundary } from "@/src/server/evaluation/boundary";
import { deriveDashboardAnalytics } from "@/src/server/goals/repository";
import { deriveLearningPath } from "@/src/server/goals/learning-path";
import { deriveGamification } from "@/src/server/goals/gamification";
import type {
  DashboardCompetencyRecord,
  DashboardEvaluationRecord,
  DashboardExerciseRecord,
} from "@/src/server/goals/repository";

describe("Canonical End-to-End Learner Journey (ASD-STE100 Spec)", () => {
  it("generates language-aware curriculum for Japanese with script and Keigo foundations", () => {
    const plans = generateGoalCurriculum("Lead engineering standups in Japanese in Tokyo");
    expect(plans.length).toBeGreaterThanOrEqual(2);

    const scriptPlan = plans[0];
    expect(scriptPlan.competencyDescription).toContain("Hiragana, Katakana & Script Foundations");
    expect(scriptPlan.exercises.length).toBeGreaterThanOrEqual(1);

    const parsed = parseExerciseDetails(
      scriptPlan.exercises[0].scenarioPrompt,
      scriptPlan.exercises[0].expectedStructure,
    );
    expect(parsed.targetVocabulary).toContain("あ (a)");
    expect(parsed.targetVocabulary).toContain("お (o)");
    expect(parsed.speechPrompt).toContain("Pronounce each vowel clearly");

    const standupPlan = plans[1];
    expect(standupPlan.competencyDescription).toContain("Workplace Japanese");
    expect(standupPlan.exercises[0].scenarioPrompt).toContain("お疲れ様です");
  });

  it("uses the selected starting level to configure the initial Japanese exercise difficulty", () => {
    const fresher = generateGoalCurriculum("Learn Japanese", "fresher");
    const intermediate = generateGoalCurriculum("Learn Japanese", "intermediate");
    const advanced = generateGoalCurriculum("Learn Japanese", "advanced");

    expect(parseExerciseDetails(fresher[0].exercises[0].scenarioPrompt, fresher[0].exercises[0].expectedStructure).difficulty).toBe("Foundational");
    expect(parseExerciseDetails(intermediate[0].exercises[0].scenarioPrompt, intermediate[0].exercises[0].expectedStructure).difficulty).toBe("Intermediate");
    expect(parseExerciseDetails(advanced[0].exercises[0].scenarioPrompt, advanced[0].exercises[0].expectedStructure).difficulty).toBe("Advanced");
  });

  it("generates language-aware curriculum for Hindi with Devanagari script foundations", () => {
    const plans = generateGoalCurriculum("Deliver technical status updates in Hindi");
    expect(plans.length).toBeGreaterThanOrEqual(2);

    const scriptPlan = plans[0];
    expect(scriptPlan.competencyDescription).toContain("Devanagari Script Foundations");
    expect(scriptPlan.exercises[0].scenarioPrompt).toContain("अ (a)");
    expect(scriptPlan.exercises[0].scenarioPrompt).toContain("मात्राएँ");

    const standupPlan = plans[1];
    expect(standupPlan.competencyDescription).toContain("Hindi");
    expect(standupPlan.exercises[0].scenarioPrompt).toContain("Rahul");
  });

  it("generates professional engineering curriculum for English standups", () => {
    const plans = generateGoalCurriculum("Lead daily engineering sprint standup");
    expect(plans.length).toBeGreaterThanOrEqual(2);
    expect(plans[0].competencyDescription).toContain("Status reporting and blocker articulation");
    expect(plans[1].competencyDescription).toContain("Technical discussion");
  });

  it("evaluates learner responses honestly with deterministic fallback and explicit source disclosure", async () => {
    const boundary = createEvaluationBoundary();
    const result = await boundary.evaluate({
      scenarioPrompt: "Explain the API latency fix and staging credential blocker to your tech lead.",
      expectedStructure: "State completed profiling yesterday, caching layer today, and blocker on credentials.",
      response: "Yesterday I completed profiling the API latency issue. Today I am developing the caching service layer, but I am blocked waiting for staging credentials.",
    });

    expect(result.source).toBe("fallback");
    expect(result.fallbackReason).toBe("no_provider_configured");
    expect(result.result.schemaVersion).toBe("speakql.evaluation.v1");
    expect(result.result.score).toBe("mastered");
    expect(result.result.feedback).toBeTruthy();
    expect(result.result.criteria.length).toBe(3);
    expect(result.result.criteria.every((c) => c.passed)).toBe(true);
  });

  it("derives explainable next-best action and prevents mastery score inflation", () => {
    const competencies: DashboardCompetencyRecord[] = [
      { id: "comp-1", goalId: "goal-1", description: "Script foundations", status: "pending" },
      { id: "comp-2", goalId: "goal-1", description: "Workplace reporting", status: "pending" },
    ];

    const exercises: DashboardExerciseRecord[] = [
      { id: "ex-1", competencyId: "comp-1", scenarioPrompt: "Trace vowels", expectedStructure: "Accurate script" },
      { id: "ex-2", competencyId: "comp-2", scenarioPrompt: "Standup status", expectedStructure: "Concise status" },
    ];

    const evaluations: DashboardEvaluationRecord[] = [
      {
        id: "ev-1",
        exerciseId: "ex-1",
        score: "mastered",
        createdAt: "2026-10-15T01:00:00Z",
      },
    ];

    const analytics = deriveDashboardAnalytics(competencies, exercises, evaluations);
    expect(analytics.measured.completedEvaluations).toBe(1);
    expect(analytics.measured.masteredEvaluations).toBe(1);
    expect(analytics.estimate.progressPercentage).toBe(50); // 1 out of 2 exercises mastered
    expect(analytics.nextAction?.exerciseId).toBe("ex-2");
    expect(analytics.nextAction?.kind).toBe("least_practiced");
    expect(analytics.nextAction?.rationale).toContain("no recorded evaluation");
  });

  it("unlocks learning path modules progressively and marks active checkpoints", () => {
    const competencies: DashboardCompetencyRecord[] = [
      { id: "comp-1", goalId: "goal-1", description: "Foundational vowels", status: "pending" },
      { id: "comp-2", goalId: "goal-1", description: "Workplace conversation", status: "pending" },
    ];

    const exercises: DashboardExerciseRecord[] = [
      { id: "ex-1", competencyId: "comp-1", scenarioPrompt: "Vowels", expectedStructure: "Vowels" },
      { id: "ex-2", competencyId: "comp-2", scenarioPrompt: "Dialogue", expectedStructure: "Dialogue" },
    ];

    const path = deriveLearningPath(competencies, exercises, [], "ex-1");
    expect(path.modules.length).toBe(2);
    expect(path.modules[0].lessons[0].state).toBe("available");
    expect(path.modules[1].lessons[0].state).toBe("locked"); // Locked until module 1 completed
  });

  it("keeps the next lesson locked after needs_work and unlocks only after mastery", () => {
    const competencies: DashboardCompetencyRecord[] = [
      { id: "comp-1", goalId: "goal-1", description: "Foundational vowels", status: "pending" },
      { id: "comp-2", goalId: "goal-1", description: "Core vocabulary", status: "pending" },
    ];
    const exercises: DashboardExerciseRecord[] = [
      { id: "ex-1", competencyId: "comp-1", scenarioPrompt: "Recognize あ", expectedStructure: "あ" },
      { id: "ex-2", competencyId: "comp-2", scenarioPrompt: "Read a basic word", expectedStructure: "A valid word" },
    ];

    const failedPath = deriveLearningPath(competencies, exercises, [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-16T10:00:00Z" },
    ]);
    expect(failedPath.modules[0].lessons[0].state).toBe("review_recommended");
    expect(failedPath.modules[1].lessons[0].state).toBe("locked");

    const masteredPath = deriveLearningPath(competencies, exercises, [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-16T10:00:00Z" },
    ]);
    expect(masteredPath.modules[0].lessons[0].state).toBe("completed");
    expect(masteredPath.modules[1].lessons[0].state).toBe("available");
  });

  it("calculates gamification XP and daily goals without spam inflation", () => {
    const exercises: DashboardExerciseRecord[] = [
      { id: "ex-1", competencyId: "comp-1", scenarioPrompt: "Prompt", expectedStructure: "Structure" },
    ];

    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-15T00:00:00Z" },
      { id: "ev-2", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-15T00:05:00Z" },
      { id: "ev-3", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-15T00:10:00Z" },
      { id: "ev-4", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-15T00:15:00Z" },
    ];

    const gamification = deriveGamification(evaluations, exercises, []);
    // Base 20 + Mastery 10 + 2 review bonus capped at 10 = 40 XP max, not unbounded
    expect(gamification.totalXp).toBe(40);
  });
});
