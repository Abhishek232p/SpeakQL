'use server';

import { createSupabaseAuthProvider } from "@/src/server/auth/supabase";
import { getDb } from "@/src/server/db/client";
import { createGoalsRepository, ExerciseAccessLockedError } from "@/src/server/goals/repository";
import { revalidatePath } from "next/cache";

const MAX_GOAL_DESCRIPTION_LENGTH = 2_000;
const MAX_PRACTICE_RESPONSE_LENGTH = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AUTHENTICATION_REQUIRED = "Please sign in to continue.";
const AUTHENTICATION_UNAVAILABLE = "Unable to verify your session. Please sign in again.";
const GOAL_WRITE_FAILED = "Unable to save your goal. Please try again.";
const EVALUATION_WRITE_FAILED = "Unable to save your response. Please try again.";

class ActionInputError extends Error {}
class AuthenticationRequiredError extends Error {}

async function requireIdentity() {
  try {
    const authProvider = createSupabaseAuthProvider();
    const identity = await authProvider.getIdentity();
    if (!identity) throw new AuthenticationRequiredError(AUTHENTICATION_REQUIRED);
    return identity;
  } catch (error) {
    if (error instanceof AuthenticationRequiredError) throw error;
    throw new Error(AUTHENTICATION_UNAVAILABLE);
  }
}

function readSingleString(formData: FormData, field: string, maxLength: number): string {
  if (!(formData instanceof FormData)) throw new ActionInputError(`Invalid ${field}.`);

  const values = formData.getAll(field);
  if (values.length !== 1 || typeof values[0] !== "string") {
    throw new ActionInputError(`Invalid ${field}.`);
  }

  const value = values[0];
  if (value.length > maxLength) throw new ActionInputError(`Invalid ${field}.`);

  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new ActionInputError(`Invalid ${field}.`);
  }

  return normalized;
}

function readExerciseId(exerciseId: unknown): string {
  if (typeof exerciseId !== "string" || !UUID_PATTERN.test(exerciseId)) {
    throw new ActionInputError("Invalid exercise.");
  }
  return exerciseId;
}

async function runDatabaseWrite<T>(write: () => Promise<T>, safeMessage: string): Promise<T> {
  try {
    const result = await write();
    revalidatePath('/dashboard');
    return result;
  } catch (error) {
    if (error instanceof ExerciseAccessLockedError) throw error;
    throw new Error(safeMessage);
  }
}

export async function createLearningGoal(formData: FormData) {
  const identity = await requireIdentity();
  const description = readSingleString(formData, 'description', MAX_GOAL_DESCRIPTION_LENGTH);
  const startingLevelValue = formData.get('startingLevel');
  const allowedStartingLevels = new Set(['fresher', 'intermediate', 'advanced']);
  if (typeof startingLevelValue !== 'string' || !allowedStartingLevels.has(startingLevelValue)) {
    throw new ActionInputError('Choose Fresher, Intermediate, or Advanced.');
  }

  const targetLanguageValue = formData.get('targetLanguage');
  const targetLanguage = typeof targetLanguageValue === 'string' && targetLanguageValue.trim().length > 0
    ? targetLanguageValue.trim()
    : undefined;

  const goalInput: { description: string; startingLevel: 'fresher' | 'intermediate' | 'advanced'; targetLanguage?: string } = {
    description,
    startingLevel: startingLevelValue as 'fresher' | 'intermediate' | 'advanced',
  };
  if (targetLanguage) {
    goalInput.targetLanguage = targetLanguage;
  }

  await runDatabaseWrite(async () => {
    const db = getDb();
    const repo = createGoalsRepository(db);
    return repo.createGoal(identity, goalInput);
  }, GOAL_WRITE_FAILED);
}

export async function updateLearningGoal(goalId: string, formData: FormData) {
  const identity = await requireIdentity();
  const validatedGoalId = readExerciseId(goalId);
  const description = readSingleString(formData, 'description', MAX_GOAL_DESCRIPTION_LENGTH);

  await runDatabaseWrite(async () => {
    const db = getDb();
    const repo = createGoalsRepository(db);
    return repo.updateGoal(identity, validatedGoalId, { description });
  }, GOAL_WRITE_FAILED);
}

export async function submitPracticeEvaluation(exerciseId: string, formData: FormData) {
  const identity = await requireIdentity();
  const validatedExerciseId = readExerciseId(exerciseId);
  const response = readSingleString(formData, 'response', MAX_PRACTICE_RESPONSE_LENGTH);

  return runDatabaseWrite(async () => {
    const db = getDb();
    const repo = createGoalsRepository(db);
    return repo.evaluateExercise(identity, validatedExerciseId, response);
  }, EVALUATION_WRITE_FAILED);
}
