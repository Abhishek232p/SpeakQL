import { z } from "zod";

/**
 * Application-owned evaluation contract. Provider SDK objects must not cross
 * this boundary; an adapter is responsible for translating them to this
 * shape before the result can be persisted.
 */
export const EVALUATION_SCHEMA_VERSION = "speakql.evaluation.v1" as const;

export const evaluationCriterionSchema = z.object({
  id: z.enum(["context", "structure", "specificity"]),
  label: z.string().trim().min(1).max(80),
  passed: z.boolean(),
  evidence: z.string().trim().min(1).max(240),
}).strict();

export const evaluationUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  costUsd: z.number().finite().nonnegative(),
}).strict();

export const evaluationResultSchema = z.object({
  schemaVersion: z.literal(EVALUATION_SCHEMA_VERSION),
  score: z.enum(["mastered", "needs_work"]),
  feedback: z.string().trim().min(1).max(2_000),
  criteria: z.array(evaluationCriterionSchema).min(1).max(5),
  mistakes: z.array(z.string().trim().min(1).max(240)).max(5),
  nextAction: z.string().trim().min(1).max(500),
  usage: evaluationUsageSchema,
}).strict();

export const evaluationRequestSchema = z.object({
  scenarioPrompt: z.string().trim().min(1).max(2_000),
  expectedStructure: z.string().trim().min(1).max(2_000),
  response: z.string().trim().min(1).max(10_000),
}).strict();

export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
export type EvaluationCriterion = z.infer<typeof evaluationCriterionSchema>;
export type EvaluationUsage = z.infer<typeof evaluationUsageSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

/**
 * Provider adapters are deliberately tiny. They receive only exercise text
 * and must return untrusted data for the boundary to validate. No provider
 * SDK, secret, user identity, or database object belongs in this interface.
 */
export interface EvaluationProvider {
  readonly id: string;
  evaluate(request: EvaluationRequest, signal: AbortSignal): Promise<unknown>;
}
