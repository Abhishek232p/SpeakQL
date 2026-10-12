import { describe, expect, it } from "vitest";
import { deriveDashboardAnalytics, type DashboardCompetencyRecord, type DashboardEvaluationRecord, type DashboardExerciseRecord } from "@/src/server/goals/repository";

const competencies: DashboardCompetencyRecord[] = [
  { id: "competency-a", goalId: "goal", description: "Vocabulary", status: "pending" },
  { id: "competency-b", goalId: "goal", description: "Judgment", status: "pending" },
];

const exercises: DashboardExerciseRecord[] = [
  { id: "exercise-a", competencyId: "competency-a", scenarioPrompt: "Use the new vocabulary.", expectedStructure: "A clear sentence." },
  { id: "exercise-b", competencyId: "competency-a", scenarioPrompt: "Respond to the customer.", expectedStructure: "A professional response." },
  { id: "exercise-c", competencyId: "competency-b", scenarioPrompt: "Make the trade-off.", expectedStructure: "A reasoned decision." },
];

function evaluation(overrides: Partial<DashboardEvaluationRecord> & Pick<DashboardEvaluationRecord, "id" | "exerciseId" | "score">): DashboardEvaluationRecord {
  return {
    createdAt: "2026-10-10T12:00:00.000Z",
    ...overrides,
  };
}

describe("dashboard analytics derived from stored evaluations", () => {
  it("keeps measured counts separate from an estimate based on each exercise's latest result", () => {
    const analytics = deriveDashboardAnalytics(competencies, exercises, [
      evaluation({ id: "evaluation-a-old", exerciseId: "exercise-a", score: "mastered", createdAt: "2026-10-09T12:00:00.000Z" }),
      evaluation({ id: "evaluation-a-latest", exerciseId: "exercise-a", score: "needs_work" }),
      evaluation({ id: "evaluation-b", exerciseId: "exercise-b", score: "mastered" }),
    ]);

    expect(analytics.measured).toEqual({
      completedEvaluations: 3,
      masteredEvaluations: 2,
      needsWorkEvaluations: 1,
      unclassifiedEvaluations: 0,
    });
    expect(analytics.estimate.progressPercentage).toBe(33);
    expect(analytics.estimate.label).toBe("Estimate");
    expect(analytics.estimate.basis).toContain("Latest result per exercise");
    expect(analytics.estimate.competencyStatuses).toEqual([
      {
        competencyId: "competency-a",
        status: "needs_work",
        completedEvaluations: 3,
        masteredEvaluations: 2,
        needsWorkEvaluations: 1,
        practicedExercises: 2,
        totalExercises: 2,
        latestScore: "needs_work",
      },
      {
        competencyId: "competency-b",
        status: "not_started",
        completedEvaluations: 0,
        masteredEvaluations: 0,
        needsWorkEvaluations: 0,
        practicedExercises: 0,
        totalExercises: 1,
        latestScore: null,
      },
    ]);
  });

  it("recommends the weakest exercise, then uses least practice as a deterministic tie-breaker", () => {
    const analytics = deriveDashboardAnalytics(competencies, exercises, [
      evaluation({ id: "evaluation-a", exerciseId: "exercise-a", score: "needs_work" }),
      evaluation({ id: "evaluation-b", exerciseId: "exercise-b", score: "needs_work", createdAt: "2026-10-09T12:00:00.000Z" }),
    ]);

    expect(analytics.nextAction).toMatchObject({
      exerciseId: "exercise-a",
      competencyId: "competency-a",
      kind: "weakest",
      latestScore: "needs_work",
      practiceCount: 1,
    });
    expect(analytics.nextAction?.rationale).toContain("needs work");
  });

  it("recommends an unpractised exercise when no weaker result is recorded", () => {
    const analytics = deriveDashboardAnalytics(competencies, exercises, [
      evaluation({ id: "evaluation-a", exerciseId: "exercise-a", score: "mastered" }),
      evaluation({ id: "evaluation-b", exerciseId: "exercise-b", score: "mastered" }),
    ]);

    expect(analytics.nextAction).toMatchObject({
      exerciseId: "exercise-c",
      kind: "least_practiced",
      practiceCount: 0,
      latestScore: null,
    });
    expect(analytics.nextAction?.rationale).toContain("establish a baseline");
  });

  it("is safe and explicit for an empty learning plan", () => {
    expect(deriveDashboardAnalytics([], [], [])).toEqual({
      measured: {
        completedEvaluations: 0,
        masteredEvaluations: 0,
        needsWorkEvaluations: 0,
        unclassifiedEvaluations: 0,
      },
      estimate: {
        progressPercentage: 0,
        label: "Estimate",
        basis: "Latest result per exercise: mastered exercises divided by total exercises. Repeated evaluations do not inflate this estimate.",
        competencyStatuses: [],
      },
      nextAction: null,
      mistakeMemory: [],
    });
  });

  it("keeps the latest needs-work feedback as mistake memory and links its next action", () => {
    const analytics = deriveDashboardAnalytics(competencies, exercises, [
      evaluation({
        id: "evaluation-needs-work",
        exerciseId: "exercise-a",
        score: "needs_work",
        feedback: [
          "Evaluation source: deterministic fallback (non-AI).",
          "Mistake memory:",
          "- Specific detail: needs work — Add one concrete example.",
          "Next action: Add one concrete example before submitting again.",
        ].join("\n"),
      }),
    ]);

    expect(analytics.mistakeMemory).toEqual([
      {
        exerciseId: "exercise-a",
        summary: "Specific detail: needs work — Add one concrete example.",
        nextAction: "Add one concrete example before submitting again.",
        createdAt: "2026-10-10T12:00:00.000Z",
      },
    ]);
    expect(analytics.nextAction?.exerciseId).toBe("exercise-a");
    expect(analytics.estimate.competencyStatuses[0]?.latestScore).toBe("needs_work");
  });
});
