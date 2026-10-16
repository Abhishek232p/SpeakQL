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

  it("keeps lesson 2 locked when lesson 1 has an attempt but is not mastered", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:00:00.000Z" },
    ];

    const path = deriveLearningPath(mockCompetencies, mockExercises, evaluations);

    const l1 = path.modules[0].lessons[0];
    const l2 = path.modules[0].lessons[1];

    expect(l1.state).toBe("review_recommended");
    expect(l2.state).toBe("locked");
    expect(path.activeLessonId).toBe("ex-1");
  });

  it("unlocks the next lesson only after the immediately preceding lesson is mastered", () => {
    const evaluations: DashboardEvaluationRecord[] = [
      { id: "ev-1", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-12T10:00:00.000Z" },
    ];

    const path = deriveLearningPath(mockCompetencies, mockExercises, evaluations);

    expect(path.modules[0].lessons[1].state).toBe("available");
    expect(path.modules[1].lessons[0].state).toBe("locked");
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

  it("maintains deterministic lesson ordering and correct prerequisite linking when exercises are passed in reversed or shuffled order", () => {
    // Reverse the exercises array completely
    const shuffledExercises = [mockExercises[2], mockExercises[1], mockExercises[0]];
    const reversedCompetencies = [mockCompetencies[1], mockCompetencies[0]];

    const path = deriveLearningPath(reversedCompetencies, shuffledExercises, []);

    // Module 1 must still contain ex-1 and ex-2; Module 2 must still contain ex-3
    expect(path.modules[0].competencyId).toBe("comp-1");
    expect(path.modules[0].lessons[0].id).toBe("ex-1");
    expect(path.modules[0].lessons[0].state).toBe("available");
    expect(path.modules[0].lessons[1].id).toBe("ex-2");
    expect(path.modules[0].lessons[1].state).toBe("locked");

    expect(path.modules[1].competencyId).toBe("comp-2");
    expect(path.modules[1].lessons[0].id).toBe("ex-3");
    expect(path.modules[1].lessons[0].state).toBe("locked");
  });

  it("blocks EVERY dependent lesson across multiple modules when lesson 1 is unmastered", () => {
    const multiComp: DashboardCompetencyRecord[] = [
      { id: "comp-1", goalId: "goal-1", description: "Unit 1", status: "pending", createdAt: "2026-10-10T10:00:00Z" },
      { id: "comp-2", goalId: "goal-1", description: "Unit 2", status: "pending", createdAt: "2026-10-10T10:01:00Z" },
    ];
    const multiEx: DashboardExerciseRecord[] = [
      { id: "ex-1", competencyId: "comp-1", scenarioPrompt: "Prompt 1", expectedStructure: "Structure 1", createdAt: "2026-10-10T10:00:00Z" },
      { id: "ex-2", competencyId: "comp-1", scenarioPrompt: "Prompt 2", expectedStructure: "Structure 2", createdAt: "2026-10-10T10:00:10Z" },
      { id: "ex-3", competencyId: "comp-2", scenarioPrompt: "Prompt 3", expectedStructure: "Structure 3", createdAt: "2026-10-10T10:01:00Z" },
      { id: "ex-4", competencyId: "comp-2", scenarioPrompt: "Prompt 4", expectedStructure: "Structure 4", createdAt: "2026-10-10T10:01:10Z" },
    ];

    // Ex 1 received needs_work
    const path = deriveLearningPath(multiComp, multiEx, [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-10T11:00:00Z" },
    ]);

    const allLessons = path.modules.flatMap((m) => m.lessons);
    expect(allLessons[0].id).toBe("ex-1");
    expect(allLessons[0].state).toBe("review_recommended"); // Failed lesson can be retried

    // Every subsequent lesson across both modules MUST be locked
    expect(allLessons[1].id).toBe("ex-2");
    expect(allLessons[1].state).toBe("locked");

    expect(allLessons[2].id).toBe("ex-3");
    expect(allLessons[2].state).toBe("locked");

    expect(allLessons[3].id).toBe("ex-4");
    expect(allLessons[3].state).toBe("locked");
  });

  it("permits retrying a failed lesson and immediately unlocks the next dependent lesson once mastery is achieved", () => {
    // Initial failed evaluation
    const initialPath = deriveLearningPath(mockCompetencies, mockExercises, [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:00:00.000Z" },
    ]);
    expect(initialPath.modules[0].lessons[0].state).toBe("review_recommended");
    expect(initialPath.modules[0].lessons[1].state).toBe("locked");

    // Retrying and achieving mastery
    const retriedPath = deriveLearningPath(mockCompetencies, mockExercises, [
      { id: "ev-1", exerciseId: "ex-1", score: "needs_work", createdAt: "2026-10-12T10:00:00.000Z" },
      { id: "ev-2", exerciseId: "ex-1", score: "mastered", createdAt: "2026-10-12T10:15:00.000Z" },
    ]);
    expect(retriedPath.modules[0].lessons[0].state).toBe("completed");
    expect(retriedPath.modules[0].lessons[1].state).toBe("available"); // Next lesson unlocked
    expect(retriedPath.modules[1].lessons[0].state).toBe("locked"); // Still locked until ex-2 is mastered
  });
});
