import type { AuthenticatedIdentity } from "@/src/server/auth/types";
import { users, learningGoals, competencies, practiceExercises, practiceEvaluations } from "@/src/server/db/schema";
import { withIdentityTransaction, type DatabaseTransaction } from "@/src/server/db/client";
import {
  createEvaluationBoundary,
  parseStoredEvaluationFeedback,
  serializeEvaluationFeedback,
  type EvaluationBoundary,
} from "@/src/server/evaluation/boundary";
import { eq, and, desc } from "drizzle-orm";
import { generateGoalCurriculum } from "./curriculum";
import { deriveLearningPath } from "./learning-path";

type Database = ReturnType<typeof import("@/src/server/db/client").getDb>;

export type DashboardScore = "mastered" | "needs_work" | "unclassified";
export type CompetencyProgressStatus = "not_started" | "needs_work" | "mastered";

export type DashboardCompetencyRecord = Readonly<{
  id: string;
  goalId: string;
  description: string;
  status: string;
}>;

export type DashboardExerciseRecord = Readonly<{
  id: string;
  competencyId: string;
  scenarioPrompt: string;
  expectedStructure: string;
  createdAt?: Date | string | number | null;
}>;

export type DashboardEvaluationRecord = Readonly<{
  id: string;
  exerciseId: string;
  userId?: string;
  userResponse?: string;
  feedback?: string;
  score: string;
  evaluationSource?: "provider" | "fallback" | "unknown";
  createdAt?: Date | string | number | null;
}>;

export type MistakeMemoryRecord = Readonly<{
  exerciseId: string;
  summary: string;
  nextAction: string | null;
  createdAt?: Date | string | number | null;
}>;

export type CompetencyProgress = Readonly<{
  competencyId: string;
  status: CompetencyProgressStatus;
  completedEvaluations: number;
  masteredEvaluations: number;
  needsWorkEvaluations: number;
  practicedExercises: number;
  totalExercises: number;
  latestScore: DashboardScore | null;
}>;

export type DashboardAnalytics = Readonly<{
  measured: Readonly<{
    completedEvaluations: number;
    masteredEvaluations: number;
    needsWorkEvaluations: number;
    unclassifiedEvaluations: number;
  }>;
  estimate: Readonly<{
    progressPercentage: number;
    label: "Estimate";
    basis: string;
    competencyStatuses: readonly CompetencyProgress[];
  }>;
  nextAction: Readonly<{
    exerciseId: string;
    competencyId: string;
    scenarioPrompt: string;
    practiceCount: number;
    latestScore: DashboardScore | null;
    kind: "weakest" | "least_practiced";
    rationale: string;
  }> | null;
  mistakeMemory: readonly MistakeMemoryRecord[];
}>;

export type DashboardData = Readonly<{
  goals: readonly Readonly<{ id: string; description: string; status: string }>[];
  competencies: readonly DashboardCompetencyRecord[];
  exercises: readonly DashboardExerciseRecord[];
  evaluations: readonly DashboardEvaluationRecord[];
  analytics: DashboardAnalytics;
}>;

const PROGRESS_BASIS = "Latest result per exercise: mastered exercises divided by total exercises. Repeated evaluations do not inflate this estimate.";

function normalizeScore(score: string): DashboardScore {
  const normalized = score.trim().toLowerCase();
  if (normalized === "mastered") return "mastered";
  if (normalized === "needs_work") return "needs_work";
  return "unclassified";
}

function evaluationTime(value: Date | string | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  }
  return Number.NEGATIVE_INFINITY;
}

function compareNewest(first: DashboardEvaluationRecord, second: DashboardEvaluationRecord): number {
  const timeDifference = evaluationTime(second.createdAt) - evaluationTime(first.createdAt);
  if (timeDifference !== 0 && !Number.isNaN(timeDifference)) return timeDifference;
  return second.id.localeCompare(first.id);
}

function countByScore(evaluations: readonly DashboardEvaluationRecord[], score: DashboardScore): number {
  return evaluations.filter((evaluation) => normalizeScore(evaluation.score) === score).length;
}

/**
 * Derives dashboard analytics from the rows already loaded for one goal.
 * The raw evaluation rows remain the measured evidence; only the latest result
 * for each exercise contributes to the explicitly labelled progress estimate.
 */
export function deriveDashboardAnalytics(
  competencies: readonly DashboardCompetencyRecord[],
  exercises: readonly DashboardExerciseRecord[],
  evaluations: readonly DashboardEvaluationRecord[],
): DashboardAnalytics {
  const evaluationsByExercise = new Map<string, DashboardEvaluationRecord[]>();
  for (const evaluation of evaluations) {
    const exerciseEvaluations = evaluationsByExercise.get(evaluation.exerciseId) ?? [];
    exerciseEvaluations.push(evaluation);
    evaluationsByExercise.set(evaluation.exerciseId, exerciseEvaluations);
  }

  const exerciseProgress = exercises.map((exercise) => {
    const exerciseEvaluations = (evaluationsByExercise.get(exercise.id) ?? []).slice().sort(compareNewest);
    const latestScore = exerciseEvaluations[0] ? normalizeScore(exerciseEvaluations[0].score) : null;
    return {
      exercise,
      practiceCount: exerciseEvaluations.length,
      latestScore,
    };
  });

  const competencyStatuses = competencies.map((competency): CompetencyProgress => {
    const competencyExercises = exerciseProgress.filter(({ exercise }) => exercise.competencyId === competency.id);
    const competencyEvaluations = competencyExercises.flatMap(({ exercise }) => evaluationsByExercise.get(exercise.id) ?? []);
    const latestScores = competencyExercises.map(({ latestScore }) => latestScore).filter((score): score is DashboardScore => score !== null);
    const hasUnpracticedExercise = competencyExercises.some(({ practiceCount }) => practiceCount === 0);
    const status: CompetencyProgressStatus = competencyExercises.length === 0 || latestScores.length === 0
      ? "not_started"
      : latestScores.every((score) => score === "mastered") && !hasUnpracticedExercise
        ? "mastered"
        : "needs_work";

    return {
      competencyId: competency.id,
      status,
      completedEvaluations: competencyEvaluations.length,
      masteredEvaluations: countByScore(competencyEvaluations, "mastered"),
      needsWorkEvaluations: countByScore(competencyEvaluations, "needs_work"),
      practicedExercises: competencyExercises.filter(({ practiceCount }) => practiceCount > 0).length,
      totalExercises: competencyExercises.length,
      latestScore: latestScores.includes("needs_work")
        ? "needs_work"
        : latestScores.includes("unclassified")
          ? "unclassified"
          : latestScores.length > 0
            ? "mastered"
            : null,
    };
  });

  const masteredExercises = exerciseProgress.filter(({ latestScore }) => latestScore === "mastered").length;
  const progressPercentage = exercises.length === 0
    ? 0
    : Math.round((masteredExercises / exercises.length) * 100);

  const recommendation = exerciseProgress
    .slice()
    .sort((first, second) => {
      const priority: Record<DashboardScore | "not_started", number> = {
        needs_work: 0,
        unclassified: 1,
        not_started: 2,
        mastered: 3,
      };
      const firstStatus = first.latestScore ?? "not_started";
      const secondStatus = second.latestScore ?? "not_started";
      const priorityDifference = priority[firstStatus] - priority[secondStatus];
      if (priorityDifference !== 0) return priorityDifference;
      if (first.practiceCount !== second.practiceCount) return first.practiceCount - second.practiceCount;
      return first.exercise.id.localeCompare(second.exercise.id);
    })[0];

  const nextAction = recommendation
    ? {
        exerciseId: recommendation.exercise.id,
        competencyId: recommendation.exercise.competencyId,
        scenarioPrompt: recommendation.exercise.scenarioPrompt,
        practiceCount: recommendation.practiceCount,
        latestScore: recommendation.latestScore,
        kind: recommendation.latestScore === "needs_work" ? "weakest" as const : "least_practiced" as const,
        rationale: recommendation.latestScore === "needs_work"
          ? `The latest recorded result needs work after ${recommendation.practiceCount} ${recommendation.practiceCount === 1 ? "evaluation" : "evaluations"}; revisit this exercise before adding new material.`
          : recommendation.practiceCount === 0
            ? "There is no recorded evaluation for this exercise yet; complete it to establish a baseline."
            : `This exercise has the fewest recorded evaluations among the remaining exercises (${recommendation.practiceCount}); use it to balance practice coverage.`,
      }
    : null;

  const mistakeMemory: MistakeMemoryRecord[] = exerciseProgress
    .flatMap(({ exercise }) => {
      const latestNeedsWork = (evaluationsByExercise.get(exercise.id) ?? [])
        .slice()
        .sort(compareNewest)
        .find((evaluation) => normalizeScore(evaluation.score) === "needs_work");
      if (!latestNeedsWork) return [];

      const metadata = parseStoredEvaluationFeedback(latestNeedsWork.feedback);
      const record: MistakeMemoryRecord = {
        exerciseId: exercise.id,
        summary: metadata.mistakes[0] ?? latestNeedsWork.feedback ?? "The latest result needs another pass.",
        nextAction: metadata.nextAction,
        createdAt: latestNeedsWork.createdAt,
      };
      return [record];
    });

  return {
    measured: {
      completedEvaluations: evaluations.length,
      masteredEvaluations: countByScore(evaluations, "mastered"),
      needsWorkEvaluations: countByScore(evaluations, "needs_work"),
      unclassifiedEvaluations: countByScore(evaluations, "unclassified"),
    },
    estimate: {
      progressPercentage,
      label: "Estimate",
      basis: PROGRESS_BASIS,
      competencyStatuses,
    },
    nextAction,
    mistakeMemory,
  };
}

export function emptyDashboardAnalytics(): DashboardAnalytics {
  return deriveDashboardAnalytics([], [], []);
}

export class ExerciseAccessLockedError extends Error {
  constructor(message = "Exercise is locked. Complete preceding prerequisite exercises to unlock it.") {
    super(message);
    this.name = "ExerciseAccessLockedError";
  }
}

export type LearnerStartingLevel = "fresher" | "intermediate" | "advanced";

export interface GoalInput {
  description: string;
  startingLevel?: LearnerStartingLevel;
  targetLanguage?: string;
}

export type GoalsRepositoryOptions = Readonly<{
  evaluationBoundary?: EvaluationBoundary;
}>;

export function createGoalsRepository(db: Database, options: GoalsRepositoryOptions = {}) {
  const evaluationBoundary = options.evaluationBoundary ?? createEvaluationBoundary();

  return {
    async createGoal(identity: AuthenticatedIdentity, input: GoalInput) {
      return withIdentityTransaction(db, identity, async (tx: DatabaseTransaction) => {
        // Find user internal ID
        const userRes = await tx.select({ id: users.id })
          .from(users)
          .where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject)))
          .limit(1);
          
        let userId = userRes[0]?.id;

        if (!userId) {
          const [newUser] = await tx.insert(users).values({
            authIssuer: identity.issuer,
            authSubject: identity.subject,
          }).returning({ id: users.id });
          userId = newUser.id;
        }

        const [goal] = await tx.insert(learningGoals).values({
          userId,
          description: input.description,
        }).returning();
        
        const curriculum = generateGoalCurriculum(input.description, {
          startingLevel: input.startingLevel ?? "fresher",
          targetLanguage: input.targetLanguage,
        });

        for (const plan of curriculum) {
          const [comp] = await tx.insert(competencies).values({
            goalId: goal.id,
            description: plan.competencyDescription,
          }).returning();

          for (const ex of plan.exercises) {
            await tx.insert(practiceExercises).values({
              competencyId: comp.id,
              scenarioPrompt: ex.scenarioPrompt,
              expectedStructure: ex.expectedStructure,
            });
          }
        }

        return goal;
      });
    },

    async updateGoal(identity: AuthenticatedIdentity, goalId: string, input: GoalInput) {
      return withIdentityTransaction(db, identity, async (tx: DatabaseTransaction) => {
        const userRes = await tx.select({ id: users.id })
          .from(users)
          .where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject)))
          .limit(1);

        const userId = userRes[0]?.id;
        if (!userId) throw new Error("User not found.");

        const ownedGoal = await tx.select({ id: learningGoals.id })
          .from(learningGoals)
          .where(and(eq(learningGoals.id, goalId), eq(learningGoals.userId, userId)))
          .limit(1);

        if (!ownedGoal[0]) throw new Error("Goal not found or not owned by user.");

        const [updatedGoal] = await tx.update(learningGoals)
          .set({
            description: input.description,
            updatedAt: new Date(),
          })
          .where(eq(learningGoals.id, goalId))
          .returning();

        // Check if evaluations exist for this goal
        const existingEvaluations = await tx.select({ id: practiceEvaluations.id })
          .from(practiceEvaluations)
          .innerJoin(practiceExercises, eq(practiceEvaluations.exerciseId, practiceExercises.id))
          .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
          .where(eq(competencies.goalId, goalId))
          .limit(1);

        if (existingEvaluations.length === 0) {
          const existingComps = await tx.select({ id: competencies.id })
            .from(competencies)
            .where(eq(competencies.goalId, goalId));

          const existingExs = await tx.select({ id: practiceExercises.id, competencyId: practiceExercises.competencyId })
            .from(practiceExercises)
            .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
            .where(eq(competencies.goalId, goalId));

          const curriculum = generateGoalCurriculum(input.description);
          for (let i = 0; i < existingComps.length && i < curriculum.length; i++) {
            await tx.update(competencies)
              .set({ description: curriculum[i].competencyDescription, updatedAt: new Date() })
              .where(eq(competencies.id, existingComps[i].id));

            const compExs = existingExs.filter(e => e.competencyId === existingComps[i].id);
            for (let j = 0; j < compExs.length && j < curriculum[i].exercises.length; j++) {
              await tx.update(practiceExercises)
                .set({
                  scenarioPrompt: curriculum[i].exercises[j].scenarioPrompt,
                  expectedStructure: curriculum[i].exercises[j].expectedStructure,
                })
                .where(eq(practiceExercises.id, compExs[j].id));
            }
          }
        }

        return updatedGoal;
      });
    },

    async getGoals(identity: AuthenticatedIdentity) {
      return withIdentityTransaction(db, identity, async (tx: DatabaseTransaction) => {
        const goals = await tx.select({
          id: learningGoals.id,
          description: learningGoals.description,
          status: learningGoals.status
        })
        .from(learningGoals)
        .innerJoin(users, eq(learningGoals.userId, users.id))
        .where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject)))
        .orderBy(desc(learningGoals.createdAt));
        
        return goals;
      });
    },

    async getDashboardData(identity: AuthenticatedIdentity) {
      return withIdentityTransaction(db, identity, async (tx: DatabaseTransaction) => {
        const goals = await tx.select({
          id: learningGoals.id,
          description: learningGoals.description,
          status: learningGoals.status
        })
        .from(learningGoals)
        .innerJoin(users, eq(learningGoals.userId, users.id))
        .where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject)))
        .orderBy(desc(learningGoals.createdAt));
        
        if (goals.length === 0) return {
          goals: [],
          competencies: [],
          exercises: [],
          evaluations: [],
          analytics: emptyDashboardAnalytics(),
        };

        const activeGoal = goals[0];
        
        let compRes = await tx.select()
          .from(competencies)
          .where(eq(competencies.goalId, activeGoal.id));
          
        let exRes = await tx.select({
          id: practiceExercises.id,
          competencyId: practiceExercises.competencyId,
          scenarioPrompt: practiceExercises.scenarioPrompt,
          expectedStructure: practiceExercises.expectedStructure,
          createdAt: practiceExercises.createdAt
        })
        .from(practiceExercises)
        .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
        .where(eq(competencies.goalId, activeGoal.id));

        const evRes = await tx.select({
          id: practiceEvaluations.id,
          exerciseId: practiceEvaluations.exerciseId,
          userId: practiceEvaluations.userId,
          userResponse: practiceEvaluations.userResponse,
          feedback: practiceEvaluations.feedback,
          score: practiceEvaluations.score,
          createdAt: practiceEvaluations.createdAt
        })
        .from(practiceEvaluations)
        .innerJoin(practiceExercises, eq(practiceEvaluations.exerciseId, practiceExercises.id))
        .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
        .where(eq(competencies.goalId, activeGoal.id))
        .orderBy(desc(practiceEvaluations.createdAt));

        // Upgrade legacy generic stub exercises if no evaluations have been recorded yet
        if (evRes.length === 0 && exRes.some(e => e.scenarioPrompt.includes("Translate this concept into a practical sentence."))) {
          const curriculum = generateGoalCurriculum(activeGoal.description);
          for (let i = 0; i < compRes.length && i < curriculum.length; i++) {
            await tx.update(competencies)
              .set({ description: curriculum[i].competencyDescription, updatedAt: new Date() })
              .where(eq(competencies.id, compRes[i].id));

            const compExercises = exRes.filter(e => e.competencyId === compRes[i].id);
            for (let j = 0; j < compExercises.length && j < curriculum[i].exercises.length; j++) {
              await tx.update(practiceExercises)
                .set({
                  scenarioPrompt: curriculum[i].exercises[j].scenarioPrompt,
                  expectedStructure: curriculum[i].exercises[j].expectedStructure,
                })
                .where(eq(practiceExercises.id, compExercises[j].id));
            }
          }

          compRes = await tx.select().from(competencies).where(eq(competencies.goalId, activeGoal.id));
          exRes = await tx.select({
            id: practiceExercises.id,
            competencyId: practiceExercises.competencyId,
            scenarioPrompt: practiceExercises.scenarioPrompt,
            expectedStructure: practiceExercises.expectedStructure,
            createdAt: practiceExercises.createdAt
          })
          .from(practiceExercises)
          .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
          .where(eq(competencies.goalId, activeGoal.id));
        }

        const evaluations = evRes.map((evaluation) => ({
          ...evaluation,
          evaluationSource: parseStoredEvaluationFeedback(evaluation.feedback).source,
        }));

        return {
          goals,
          competencies: compRes,
          exercises: exRes,
          evaluations,
          analytics: deriveDashboardAnalytics(compRes, exRes, evaluations),
        };
      });
    },

    async evaluateExercise(identity: AuthenticatedIdentity, exerciseId: string, response: string) {
      // Resolve ownership and exercise context before invoking an adapter. The
      // provider boundary must never run while a database transaction is held.
      const evaluationContext = await withIdentityTransaction(db, identity, async (tx: DatabaseTransaction) => {
        const userRes = await tx.select({ id: users.id })
          .from(users)
          .where(and(eq(users.authIssuer, identity.issuer), eq(users.authSubject, identity.subject)))
          .limit(1);

        const userId = userRes[0]?.id;
        if (!userId) throw new Error("User not found.");

        const ownedExercise = await tx.select({
          id: practiceExercises.id,
          scenarioPrompt: practiceExercises.scenarioPrompt,
          expectedStructure: practiceExercises.expectedStructure,
          competencyId: practiceExercises.competencyId,
          goalId: competencies.goalId,
        })
          .from(practiceExercises)
          .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
          .innerJoin(learningGoals, eq(competencies.goalId, learningGoals.id))
          .innerJoin(users, eq(learningGoals.userId, users.id))
          .where(and(
            eq(practiceExercises.id, exerciseId),
            eq(learningGoals.userId, userId),
            eq(users.authIssuer, identity.issuer),
            eq(users.authSubject, identity.subject),
          ))
          .limit(1);

        if (!ownedExercise[0]) throw new Error("Exercise not found or not owned by user.");

        // Server-side lesson access enforcement:
        // Ensure that direct requests cannot evaluate locked exercises.
        // Lessons only unlock when preceding prerequisite exercises have reached mastery.
        const goalCompetencies = await tx.select({
          id: competencies.id,
          goalId: competencies.goalId,
          description: competencies.description,
          status: competencies.status,
        })
          .from(competencies)
          .where(eq(competencies.goalId, ownedExercise[0].goalId));

        const goalExercises = await tx.select({
          id: practiceExercises.id,
          competencyId: practiceExercises.competencyId,
          scenarioPrompt: practiceExercises.scenarioPrompt,
          expectedStructure: practiceExercises.expectedStructure,
          createdAt: practiceExercises.createdAt,
        })
          .from(practiceExercises)
          .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
          .where(eq(competencies.goalId, ownedExercise[0].goalId));

        const goalEvaluations = await tx.select({
          id: practiceEvaluations.id,
          exerciseId: practiceEvaluations.exerciseId,
          userId: practiceEvaluations.userId,
          userResponse: practiceEvaluations.userResponse,
          feedback: practiceEvaluations.feedback,
          score: practiceEvaluations.score,
          createdAt: practiceEvaluations.createdAt,
        })
          .from(practiceEvaluations)
          .innerJoin(practiceExercises, eq(practiceEvaluations.exerciseId, practiceExercises.id))
          .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
          .where(eq(competencies.goalId, ownedExercise[0].goalId));

        if (goalCompetencies.length > 0 && goalExercises.length > 0) {
          const learningPath = deriveLearningPath(goalCompetencies, goalExercises, goalEvaluations);
          const currentLesson = learningPath.modules
            .flatMap((m) => m.lessons)
            .find((l) => l.id === exerciseId);

          if (currentLesson && currentLesson.state === "locked") {
            throw new ExerciseAccessLockedError(
              `Exercise "${exerciseId}" is locked. Complete preceding prerequisite exercises to unlock it.`
            );
          }
        }

        return { userId, exercise: ownedExercise[0] };
      });

      const decision = await evaluationBoundary.evaluate({
        scenarioPrompt: evaluationContext.exercise.scenarioPrompt,
        expectedStructure: evaluationContext.exercise.expectedStructure,
        response,
      });

      // Re-check ownership in the write transaction so a deleted or reassigned
      // exercise cannot receive a result after provider work completes.
      return withIdentityTransaction(db, identity, async (tx: DatabaseTransaction) => {
        const stillOwned = await tx.select({ id: practiceExercises.id })
          .from(practiceExercises)
          .innerJoin(competencies, eq(practiceExercises.competencyId, competencies.id))
          .innerJoin(learningGoals, eq(competencies.goalId, learningGoals.id))
          .innerJoin(users, eq(learningGoals.userId, users.id))
          .where(and(
            eq(practiceExercises.id, exerciseId),
            eq(learningGoals.userId, evaluationContext.userId),
            eq(users.authIssuer, identity.issuer),
            eq(users.authSubject, identity.subject),
          ))
          .limit(1);

        if (!stillOwned[0]) throw new Error("Exercise not found or not owned by user.");

        const [evaluation] = await tx.insert(practiceEvaluations).values({
          exerciseId,
          userId: evaluationContext.userId,
          userResponse: response,
          feedback: serializeEvaluationFeedback(decision),
          score: decision.result.score,
        }).returning();

        return evaluation;
      });
    }
  };
}
