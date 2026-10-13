import { describe, expect, it } from "vitest";
import { deriveLearningPath } from "@/src/server/goals/learning-path";
import type { DashboardCompetencyRecord, DashboardEvaluationRecord, DashboardExerciseRecord } from "@/src/server/goals/repository";

const mockCompetencies: DashboardCompetencyRecord[] = [
  { id: "comp-1", goalId: "goal-1", description: "Standup status reporting", status: "pending" },
  { id: "comp-2", goalId: "goal-1", description: "Technical discussion & unblocking", status: "pending" },
];

const mockExercises: DashboardExerciseRecord[] = [
  { id: "ex-1", competencyId: "comp-1", scenarioPrompt: JSON.stringify({ objective: "Deliver status", scenario: "Morning standup", instructions: "Give update" }), expectedStructure: "Concise update" },
  { id: "ex-2", competencyId: "comp-1", scenarioPrompt: JSON.stringify({ objective: "State blocker", scenario: "Blocker discussion", instructions: "Ask help" }), expectedStructure: "Direct ask" },
  { id: "ex-3", competencyId: "comp-2", scenarioPrompt: JSON.stringify({ objective: "Contract discussion", scenario: "API sync", instructions: "Confirm compatibility" }), expectedStructure: "Clear confirmation" },
];

describe("Learning Path: Progressive Progression & States", () => {
  it("keeps lesson 1 available while locking subsequent lessons when no evaluations exist", () => {
    const path = deriveLearningPath(mockCompetencies, mockExercises, []);

    expect(path.totalLessons).toBe(3);
    expect(path.completedLessons).toBe(0);
    expect(path.activeLessonId).toBe("ex-1");

    const l1 = path.modules[0].lessons[0];
    const l2 = path.modules[0].lessons[1];
    const l3 = path.modules[1].lessons[0];

    expect(l1.state).toBe("available");
    expect(l2.state).toBe("locked");
    expect(l3.state).toBe("locked");
  });

  it("unlocks lesson 2 once lesson 1 has recorded an evaluation attempt", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:00:00.000Z" },
    ];

    const path = deriveLearningPath(mockCompetencies, mockExercises, evaluations);

    const l1 = path.modules[0].lessons[0];
    const l2 = path.modules[0].lessons[1];

    expect(l1.state).toBe("review_recommended");
    expect(l2.state).toBe("available"); // unlocked because ex-1 has an attempt!
    expect(path.activeLessonId).toBe("ex-1"); // prioritizes review
  });

  it("marks lessons as completed when mastered and calculates unit completion", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-12T10:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-2", score: "mastered", createdAt: "2026-10-12T10:30:00.000Z" },
    ];

    const path = deriveLearningPath(mockCompetencies, mockExercises, evaluations);

    expect(path.completedLessons).toBe(2);
    expect(path.modules[0].completed).toBe(true); // both ex-1 and ex-2 mastered
    expect(path.modules[0].lessons[0].state).toBe("completed");
    expect(path.modules[0].lessons[1].state).toBe("completed");
    expect(path.modules[1].lessons[0].state).toBe("available"); // ex-3 unlocked
    expect(path.activeLessonId).toBe("ex-3");
  });
});
