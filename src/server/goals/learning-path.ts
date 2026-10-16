import type {
  DashboardCompetencyRecord,
  DashboardEvaluationRecord,
  DashboardExerciseRecord,
  DashboardScore,
} from "./repository";
import {
  parseExerciseDetails,
  generateGoalCurriculum,
  type ExerciseType,
  type StructuredCompetencyPlan,
} from "./curriculum";

export type PathLessonState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "review_recommended";

export type PathLessonNode = Readonly<{
  id: string; // exerciseId
  competencyId: string;
  order: number;
  lessonNumber: string; // e.g. "1.1", "1.2"
  title: string;
  objective: string;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  state: PathLessonState;
  competencyTitle: string;
  practiceCount: number;
  latestScore: DashboardScore | null;
  exerciseType: ExerciseType;
  checkpoint: boolean;
}>;

export type PathModule = Readonly<{
  competencyId: string;
  moduleNumber: number;
  title: string;
  description: string;
  lessons: readonly PathLessonNode[];
  completed: boolean;
}>;

export type DashboardLearningPath = Readonly<{
  modules: readonly PathModule[];
  totalLessons: number;
  completedLessons: number;
  activeLessonId: string | null;
}>;

export interface LearningPathOptions {
  goalDescription?: string | null;
  curriculumPlans?: readonly StructuredCompetencyPlan[];
}

function normalizeScore(score: string): DashboardScore {
  const normalized = score.trim().toLowerCase();
  if (normalized === "mastered") return "mastered";
  if (normalized === "needs_work") return "needs_work";
  return "unclassified";
}

/**
 * Deterministically sorts competencies.
 * 1. If curriculum plans match competency descriptions, orders by syllabus position.
 * 2. Secondary sort: createdAt timestamp ascending (earliest first).
 * 3. Final tie-breaker: deterministic string comparison of id (lexicographical).
 */
export function sortCompetenciesDeterministically(
  competencies: readonly DashboardCompetencyRecord[],
  curriculumPlans?: readonly StructuredCompetencyPlan[],
): DashboardCompetencyRecord[] {
  return [...competencies].sort((a, b) => {
    if (curriculumPlans && curriculumPlans.length > 0) {
      const idxA = curriculumPlans.findIndex((p) => p.competencyDescription.trim() === a.description.trim());
      const idxB = curriculumPlans.findIndex((p) => p.competencyDescription.trim() === b.description.trim());
      if (idxA !== -1 && idxB !== -1 && idxA !== idxB) {
        return idxA - idxB;
      }
      if (idxA !== -1 && idxB === -1) return -1;
      if (idxA === -1 && idxB !== -1) return 1;
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Deterministically sorts exercises within a competency.
 * 1. If curriculum plans match the exercise scenarioPrompt or objective, orders by syllabus position.
 * 2. Secondary sort: createdAt timestamp ascending (earliest first).
 * 3. Final tie-breaker: deterministic string comparison of id (lexicographical).
 */
export function sortExercisesDeterministically(
  exercises: readonly DashboardExerciseRecord[],
  curriculumPlans?: readonly StructuredCompetencyPlan[],
): DashboardExerciseRecord[] {
  return [...exercises].sort((a, b) => {
    if (curriculumPlans && curriculumPlans.length > 0) {
      let orderA = -1;
      let orderB = -1;
      for (const plan of curriculumPlans) {
        const foundA = plan.exercises.findIndex((e) => e.scenarioPrompt.trim() === a.scenarioPrompt.trim());
        if (foundA !== -1) {
          orderA = foundA;
          break;
        }
      }
      for (const plan of curriculumPlans) {
        const foundB = plan.exercises.findIndex((e) => e.scenarioPrompt.trim() === b.scenarioPrompt.trim());
        if (foundB !== -1) {
          orderB = foundB;
          break;
        }
      }
      if (orderA !== -1 && orderB !== -1 && orderA !== orderB) {
        return orderA - orderB;
      }
      if (orderA !== -1 && orderB === -1) return -1;
      if (orderA === -1 && orderB !== -1) return 1;
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Builds an engaging, ordered Learning Path from competencies, exercises, and recorded evaluations.
 * Lessons unlock only when the immediately preceding lesson is mastered. An attempt or a needs-work result never unlocks later content.
 */
export function deriveLearningPath(
  competencies: readonly DashboardCompetencyRecord[],
  exercises: readonly DashboardExerciseRecord[],
  evaluations: readonly DashboardEvaluationRecord[],
  recommendedExerciseId?: string | null,
  options?: LearningPathOptions,
): DashboardLearningPath {
  let curriculumPlans = options?.curriculumPlans;
  if (!curriculumPlans && options?.goalDescription) {
    try {
      curriculumPlans = generateGoalCurriculum(options.goalDescription);
    } catch {
      // Graceful fallback to timestamp/ID tie-breaking if goalDescription parsing fails
    }
  }

  // 1. Sort competencies deterministically
  const sortedCompetencies = sortCompetenciesDeterministically(competencies, curriculumPlans);

  // 2. Group and sort exercises per competency deterministically
  const sortedExercisesByComp = new Map<string, DashboardExerciseRecord[]>();
  for (const comp of sortedCompetencies) {
    const raw = exercises.filter((ex) => ex.competencyId === comp.id);
    sortedExercisesByComp.set(comp.id, sortExercisesDeterministically(raw, curriculumPlans));
  }

  // 3. Establish the single, canonical, flattened lesson sequence across all modules
  const canonicalOrderedExercises: DashboardExerciseRecord[] = [];
  for (const comp of sortedCompetencies) {
    const compList = sortedExercisesByComp.get(comp.id) ?? [];
    for (const ex of compList) {
      canonicalOrderedExercises.push(ex);
    }
  }

  const evaluationsByExercise = new Map<string, DashboardEvaluationRecord[]>();
  for (const ev of evaluations) {
    const list = evaluationsByExercise.get(ev.exerciseId) ?? [];
    list.push(ev);
    evaluationsByExercise.set(ev.exerciseId, list);
  }

  let totalLessons = 0;
  let completedLessons = 0;
  let globalIndex = 0;

  const modules: PathModule[] = sortedCompetencies.map((competency, compIndex) => {
    const compExercises = sortedExercisesByComp.get(competency.id) ?? [];
    const lessons: PathLessonNode[] = [];

    compExercises.forEach((exercise, exIndex) => {
      totalLessons += 1;
      const order = globalIndex + 1;
      const lessonGlobalIndex = globalIndex;
      globalIndex += 1;

      const exEvals = (evaluationsByExercise.get(exercise.id) ?? []).slice().sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      const practiceCount = exEvals.length;
      const latestScore = exEvals[0] ? normalizeScore(exEvals[0].score) : null;

      // Determine lesson state
      let state: PathLessonState;
      if (latestScore === "mastered") {
        state = "completed";
        completedLessons += 1;
      } else if (latestScore === "needs_work") {
        state = "review_recommended";
      } else if (practiceCount > 0) {
        state = "in_progress";
      } else {
        // First lesson is the only initial entry point.
        // Every later lesson requires a mastered result for the IMMEDIATELY PRECEDING lesson
        // in the canonical, deterministic lesson sequence.
        if (lessonGlobalIndex === 0) {
          state = "available";
        } else {
          const prevEx = canonicalOrderedExercises[lessonGlobalIndex - 1];
          const previousEvaluations = prevEx ? (evaluationsByExercise.get(prevEx.id) ?? []) : [];
          const latestPreviousEvaluation = previousEvaluations
            .slice()
            .sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeB - timeA;
            })[0];
          state = latestPreviousEvaluation && normalizeScore(latestPreviousEvaluation.score) === "mastered"
            ? "available"
            : "locked";
        }
      }

      const details = parseExerciseDetails(exercise.scenarioPrompt, exercise.expectedStructure);
      const isCheckpoint = exIndex === compExercises.length - 1;

      lessons.push({
        id: exercise.id,
        competencyId: competency.id,
        order,
        lessonNumber: `${compIndex + 1}.${exIndex + 1}`,
        title: details.objective,
        objective: details.objective,
        difficulty: details.difficulty,
        estimatedMinutes: details.estimatedMinutes,
        state,
        competencyTitle: competency.description,
        practiceCount,
        latestScore,
        exerciseType: details.exerciseType,
        checkpoint: isCheckpoint,
      });
    });

    const isModuleCompleted = lessons.length > 0 && lessons.every((l) => l.state === "completed");

    return {
      competencyId: competency.id,
      moduleNumber: compIndex + 1,
      title: `Unit ${compIndex + 1}: ${competency.description}`,
      description: competency.description,
      lessons,
      completed: isModuleCompleted,
    };
  });

  // Active lesson selection:
  // If recommendedExerciseId matches an available/in_progress/review_recommended lesson, use it.
  // Otherwise pick the first non-completed lesson, or the first lesson.
  const allLessons = modules.flatMap((m) => m.lessons);
  let activeLessonId: string | null = null;

  if (recommendedExerciseId) {
    const matched = allLessons.find((l) => l.id === recommendedExerciseId && l.state !== "locked");
    if (matched) activeLessonId = matched.id;
  }

  if (!activeLessonId) {
    const nextActionable = allLessons.find(
      (l) => l.state === "review_recommended" || l.state === "available" || l.state === "in_progress",
    );
    activeLessonId = nextActionable ? nextActionable.id : (allLessons[0]?.id ?? null);
  }

  return {
    modules,
    totalLessons,
    completedLessons,
    activeLessonId,
  };
}
