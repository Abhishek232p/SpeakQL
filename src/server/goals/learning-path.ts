import type {
  DashboardCompetencyRecord,
  DashboardEvaluationRecord,
  DashboardExerciseRecord,
  DashboardScore,
} from "./repository";
import { parseExerciseDetails, type ExerciseType } from "./curriculum";

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

function normalizeScore(score: string): DashboardScore {
  const normalized = score.trim().toLowerCase();
  if (normalized === "mastered") return "mastered";
  if (normalized === "needs_work") return "needs_work";
  return "unclassified";
}

/**
 * Builds an engaging, ordered Learning Path from competencies, exercises, and recorded evaluations.
 * Lessons unlock progressively as preceding activities are attempted or mastered.
 */
export function deriveLearningPath(
  competencies: readonly DashboardCompetencyRecord[],
  exercises: readonly DashboardExerciseRecord[],
  evaluations: readonly DashboardEvaluationRecord[],
  recommendedExerciseId?: string | null,
): DashboardLearningPath {
  const evaluationsByExercise = new Map<string, DashboardEvaluationRecord[]>();
  for (const ev of evaluations) {
    const list = evaluationsByExercise.get(ev.exerciseId) ?? [];
    list.push(ev);
    evaluationsByExercise.set(ev.exerciseId, list);
  }

  let totalLessons = 0;
  let completedLessons = 0;
  let globalIndex = 0;

  const modules: PathModule[] = competencies.map((competency, compIndex) => {
    const compExercises = exercises.filter((ex) => ex.competencyId === competency.id);
    const lessons: PathLessonNode[] = [];

    compExercises.forEach((exercise, exIndex) => {
      totalLessons += 1;
      const order = globalIndex + 1;
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
        // For unpracticed exercises, check prerequisite:
        // First exercise is always available.
        // Subsequent exercises unlock if previous exercise has at least 1 practice attempt.
        if (order === 1) {
          state = "available";
        } else {
          const prevEx = exercises[order - 2];
          const prevPracticeCount = prevEx ? (evaluationsByExercise.get(prevEx.id)?.length ?? 0) : 0;
          state = prevPracticeCount > 0 ? "available" : "locked";
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
