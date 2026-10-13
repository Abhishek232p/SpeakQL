import {
  EVALUATION_SCHEMA_VERSION,
  evaluationRequestSchema,
  evaluationResultSchema,
  type EvaluationCriterion,
  type EvaluationProvider,
  type EvaluationRequest,
  type EvaluationResult,
} from "./contracts";

export const DEFAULT_EVALUATION_LIMITS = {
  timeoutMs: 1_500,
  maxInputChars: 10_000,
  maxInputTokens: 4_000,
  maxOutputChars: 4_000,
  maxOutputTokens: 1_200,
  maxCostUsd: 0.05,
} as const;

export type EvaluationLimits = {
  timeoutMs: number;
  maxInputChars: number;
  maxInputTokens: number;
  maxOutputChars: number;
  maxOutputTokens: number;
  maxCostUsd: number;
};

export type EvaluationFallbackReason =
  | "no_provider_configured"
  | "invalid_request"
  | "input_usage_limit"
  | "provider_timeout"
  | "provider_error"
  | "invalid_provider_output"
  | "output_usage_limit";

export type EvaluationDecision = Readonly<{
  source: "provider" | "fallback";
  providerId?: string;
  fallbackReason?: EvaluationFallbackReason;
  result: EvaluationResult;
}>;

export type EvaluationBoundary = Readonly<{
  evaluate(request: EvaluationRequest): Promise<EvaluationDecision>;
}>;

export type EvaluationBoundaryOptions = Readonly<{
  provider?: EvaluationProvider;
  limits?: Partial<EvaluationLimits>;
}>;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "in", "into", "is", "it", "of", "on", "or", "the", "this", "to", "what", "when", "where", "with", "you",
]);

function estimateTokens(value: string): number {
  return Math.ceil(value.length / 4);
}

function countWords(value: string): number {
  const words = value.trim().match(/\S+/g);
  return words?.length ?? 0;
}

function significantWords(value: string): Set<string> {
  return new Set(
    value
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !STOP_WORDS.has(word)),
  );
}

function extractPromptText(request: EvaluationRequest): { scenario: string; instructions: string; expected: string } {
  let scenario = request.scenarioPrompt;
  let instructions = "";
  if (request.scenarioPrompt.startsWith("{") && request.scenarioPrompt.endsWith("}")) {
    try {
      const parsed = JSON.parse(request.scenarioPrompt);
      if (typeof parsed.scenario === "string") scenario = parsed.scenario;
      if (typeof parsed.instructions === "string") instructions = parsed.instructions;
    } catch {
      // keep raw
    }
  }
  return { scenario, instructions, expected: request.expectedStructure };
}

function extractKeyExcerpts(response: string): { opening: string; body: string; sentences: string[] } {
  const sentences = response.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  const firstSentence = sentences[0] || response.trim();
  const opening = firstSentence.length > 80 ? firstSentence.slice(0, 77) + "…" : firstSentence;
  const body = sentences.slice(1).join(" ");
  return { opening, body, sentences };
}

function hasContextSignal(request: EvaluationRequest): boolean {
  const { scenario, instructions, expected } = extractPromptText(request);
  const promptWords = new Set([
    ...significantWords(scenario),
    ...significantWords(instructions),
    ...significantWords(expected),
  ]);
  if (promptWords.size === 0) return true;
  const responseWords = significantWords(request.response);
  return [...promptWords].some((word) => responseWords.has(word));
}

function hasStructureSignal(response: string): boolean {
  return /[.!?](?:\s|$)/u.test(response) || /\n\s*\S/u.test(response);
}

function criterionEvidence(criterion: EvaluationCriterion): string {
  return `${criterion.label}: ${criterion.passed ? "pass" : "needs work"} — ${criterion.evidence}`;
}

function fallbackResult(request: EvaluationRequest): EvaluationResult {
  const response = request.response.trim();
  const wordCount = countWords(response);
  const { opening, sentences } = extractKeyExcerpts(response);
  const contextPassed = hasContextSignal(request);
  const structurePassed = hasStructureSignal(response) && sentences.length >= 1;
  const specificityPassed = wordCount >= 8 && sentences.length >= 1;

  const contextEvidence = contextPassed
    ? `Engaged situational context effectively with relevant phrasing: "${opening}".`
    : "The response does not explicitly incorporate situational terminology or scenario details.";

  const structureEvidence = structurePassed
    ? `Organized message across ${sentences.length} cohesive ${sentences.length === 1 ? "sentence" : "sentences"} with clear boundaries.`
    : "Add clear sentence boundaries, punctuation, or paragraph division to structure your message.";

  const specificityEvidence = specificityPassed
    ? `Provided substantive communication with sufficient detail (${wordCount} words) rather than a brief assertion.`
    : `Response is too brief or general (${wordCount} words); expand with concrete actions, reasoning, or next steps.`;

  const criteria: EvaluationCriterion[] = [
    {
      id: "context",
      label: "Context signal",
      passed: contextPassed,
      evidence: contextEvidence,
    },
    {
      id: "structure",
      label: "Clear structure",
      passed: structurePassed,
      evidence: structureEvidence,
    },
    {
      id: "specificity",
      label: "Specific detail",
      passed: specificityPassed,
      evidence: specificityEvidence,
    },
  ];

  const failedCriteria = criteria.filter((criterion) => !criterion.passed);
  const score = failedCriteria.length === 0 ? "mastered" : "needs_work";
  const mistakes = failedCriteria.map((criterion) => criterionEvidence(criterion));

  const whatWentWell = score === "mastered"
    ? `Clear communicative delivery: Your response directly addresses the situation ("${opening}") with appropriate structure and substantive detail.`
    : `Communicative attempt recorded: You initiated your response with "${opening}".`;

  const areasToImprove = failedCriteria.length > 0
    ? `Focus on: ${failedCriteria.map((c) => c.label.toLowerCase() + " (" + c.evidence + ")").join("; ")}.`
    : "To further develop natural fluency, practice delivering this response conversationally within real-time pacing.";

  const nextAction = score === "mastered"
    ? "Try this scenario again with an added constraint (e.g. tighter time limit or unexpected peer follow-up)."
    : `Revise your response: address ${failedCriteria.map((c) => c.label.toLowerCase()).join(" and ")} to complete a robust baseline.`;

  const feedback = [
    score === "mastered"
      ? "Mastered baseline criteria for this practice scenario."
      : "Needs work to satisfy all baseline communicative criteria.",
    `Strengths: ${whatWentWell}`,
    `Areas to refine: ${areasToImprove}`,
    "Notice: Evaluated using deterministic non-AI baseline analysis (checks communicative structure, context keywords, and substantive detail; does not evaluate subtle pragmatic nuance).",
  ].join("\n");

  return {
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    score,
    feedback,
    criteria,
    mistakes,
    nextAction,
    usage: {
      inputTokens: estimateTokens(`${request.scenarioPrompt}\n${request.expectedStructure}\n${response}`),
      outputTokens: estimateTokens(criteria.map(criterionEvidence).join("\n")),
      costUsd: 0,
    },
  };
}

function mergeLimits(limits: Partial<EvaluationLimits> | undefined): EvaluationLimits {
  const merged = { ...DEFAULT_EVALUATION_LIMITS, ...limits };
  for (const [name, value] of Object.entries(merged)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Evaluation limit ${name} must be a positive finite number.`);
    }
  }
  return merged;
}

function outputSize(result: EvaluationResult): number {
  return JSON.stringify(result).length;
}

function usageWithinLimits(result: EvaluationResult, limits: EvaluationLimits): boolean {
  return result.usage.outputTokens <= limits.maxOutputTokens
    && result.usage.costUsd <= limits.maxCostUsd;
}

class ProviderTimeoutError extends Error {
  public constructor() {
    super("provider timeout");
    this.name = "ProviderTimeoutError";
  }
}

async function evaluateProvider(
  provider: EvaluationProvider,
  request: EvaluationRequest,
  timeoutMs: number,
): Promise<unknown> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      provider.evaluate(request, controller.signal),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new ProviderTimeoutError());
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Creates the application-owned evaluation boundary. The current application
 * passes no provider, so this path performs no network I/O and always returns
 * an explicitly labelled non-AI fallback. A future adapter can be injected
 * without changing persistence or the dashboard contract.
 */
export function createEvaluationBoundary(options: EvaluationBoundaryOptions = {}): EvaluationBoundary {
  const limits = mergeLimits(options.limits);

  return {
    async evaluate(request: EvaluationRequest): Promise<EvaluationDecision> {
      const parsedRequest = evaluationRequestSchema.safeParse(request);
      if (!parsedRequest.success) {
        return {
          source: "fallback",
          fallbackReason: "invalid_request",
          result: fallbackResult({
            scenarioPrompt: typeof request?.scenarioPrompt === "string" && request.scenarioPrompt.trim() ? request.scenarioPrompt : "the scenario",
            expectedStructure: typeof request?.expectedStructure === "string" && request.expectedStructure.trim() ? request.expectedStructure : "a clear response",
            response: typeof request?.response === "string" && request.response.trim() ? request.response : "No response was provided.",
          }),
        };
      }

      const normalizedRequest = parsedRequest.data;
      const inputChars = normalizedRequest.scenarioPrompt.length + normalizedRequest.expectedStructure.length + normalizedRequest.response.length;
      const inputTokens = estimateTokens(`${normalizedRequest.scenarioPrompt}\n${normalizedRequest.expectedStructure}\n${normalizedRequest.response}`);
      if (inputChars > limits.maxInputChars || inputTokens > limits.maxInputTokens) {
        return {
          source: "fallback",
          fallbackReason: "input_usage_limit",
          result: fallbackResult(normalizedRequest),
        };
      }

      if (!options.provider) {
        return {
          source: "fallback",
          fallbackReason: "no_provider_configured",
          result: fallbackResult(normalizedRequest),
        };
      }

      let rawOutput: unknown;
      try {
        rawOutput = await evaluateProvider(options.provider, normalizedRequest, limits.timeoutMs);
      } catch (error) {
        return {
          source: "fallback",
          fallbackReason: error instanceof ProviderTimeoutError ? "provider_timeout" : "provider_error",
          result: fallbackResult(normalizedRequest),
        };
      }

      const parsedOutput = evaluationResultSchema.safeParse(rawOutput);
      if (!parsedOutput.success) {
        return {
          source: "fallback",
          fallbackReason: "invalid_provider_output",
          result: fallbackResult(normalizedRequest),
        };
      }

      if (outputSize(parsedOutput.data) > limits.maxOutputChars || !usageWithinLimits(parsedOutput.data, limits)) {
        return {
          source: "fallback",
          fallbackReason: "output_usage_limit",
          result: fallbackResult(normalizedRequest),
        };
      }

      return {
        source: "provider",
        providerId: options.provider.id,
        result: parsedOutput.data,
      };
    },
  };
}

const fallbackReasonText: Record<EvaluationFallbackReason, string> = {
  no_provider_configured: "no AI provider is configured",
  invalid_request: "the evaluation request did not satisfy the input contract",
  input_usage_limit: "the input usage limit was reached",
  provider_timeout: "the configured provider exceeded the timeout",
  provider_error: "the configured provider returned an error",
  invalid_provider_output: "the provider output failed structured validation",
  output_usage_limit: "the provider output exceeded the usage or cost limit",
};

/**
 * Serializes the validated result into the existing feedback column. The
 * current schema has no evaluation-source column, so the source and criteria
 * are stored in a bounded, human-readable record instead of requiring a
 * migration.
 */
export function serializeEvaluationFeedback(decision: EvaluationDecision): string {
  const source = decision.source === "fallback"
    ? "Evaluation source: deterministic fallback (non-AI)."
    : `Evaluation source: configured provider (${decision.providerId ?? "unknown"}).`;
  const reason = decision.fallbackReason
    ? `Fallback reason: ${fallbackReasonText[decision.fallbackReason]}.`
    : undefined;
  const criteria = decision.result.criteria.map((criterion) => `- ${criterionEvidence(criterion)}`);
  const mistakes = decision.result.mistakes.length > 0
    ? decision.result.mistakes.map((mistake) => `- ${mistake}`)
    : ["- No deterministic mistake signal recorded."];

  return [
    source,
    reason,
    `Contract: ${decision.result.schemaVersion}.`,
    decision.result.feedback,
    "Criteria:",
    ...criteria,
    "Mistake memory:",
    ...mistakes,
    `Next action: ${decision.result.nextAction}`,
  ].filter((line): line is string => Boolean(line)).join("\n");
}

export type StoredEvaluationMetadata = Readonly<{
  source: "provider" | "fallback" | "unknown";
  mistakes: readonly string[];
  nextAction: string | null;
  strengths: string | null;
  areasToRefine: string | null;
  criteriaEvidence: readonly string[];
  summaryFeedback: string;
}>;

/** Read structured metadata written by serializeEvaluationFeedback. */
export function parseStoredEvaluationFeedback(feedback: string | null | undefined): StoredEvaluationMetadata {
  const value = feedback ?? "";
  const source = value.startsWith("Evaluation source: deterministic fallback (non-AI).")
    ? "fallback"
    : value.startsWith("Evaluation source: configured provider (")
      ? "provider"
      : "unknown";

  const mistakesStart = value.indexOf("Mistake memory:\n");
  const nextActionStart = value.indexOf("\nNext action: ");
  const criteriaStart = value.indexOf("Criteria:\n");

  const mistakes = mistakesStart >= 0
    ? value.slice(mistakesStart + "Mistake memory:\n".length, nextActionStart >= 0 ? nextActionStart : value.length)
        .split("\n")
        .map((line) => line.replace(/^-\s*/, "").trim())
        .filter(Boolean)
    : [];

  const nextAction = nextActionStart >= 0
    ? value.slice(nextActionStart + "\nNext action: ".length).trim() || null
    : null;

  const criteriaEvidence = criteriaStart >= 0
    ? value.slice(criteriaStart + "Criteria:\n".length, mistakesStart >= 0 ? mistakesStart : value.length)
        .split("\n")
        .map((line) => line.replace(/^-\s*/, "").trim())
        .filter(Boolean)
    : [];

  // Extract strengths and areas to refine
  let strengths: string | null = null;
  let areasToRefine: string | null = null;

  const strengthsMatch = value.match(/Strengths:\s*([\s\S]+?)(?=\nAreas to refine:|\nCriteria:|\nMistake memory:|$)/);
  if (strengthsMatch && strengthsMatch[1]) {
    strengths = strengthsMatch[1].trim();
  }

  const areasMatch = value.match(/Areas to refine:\s*([\s\S]+?)(?=\nNotice:|\nCriteria:|\nMistake memory:|$)/);
  if (areasMatch && areasMatch[1]) {
    areasToRefine = areasMatch[1].trim();
  }

  // Extract summary feedback
  const contractIdx = value.indexOf("Contract: speakql.evaluation.v1.");
  let summaryFeedback = "";
  if (contractIdx >= 0) {
    const afterContract = value.slice(contractIdx + "Contract: speakql.evaluation.v1.".length).trim();
    const criteriaOrMistakesIdx = afterContract.search(/\n(?:Criteria:|Mistake memory:|Strengths:)/);
    summaryFeedback = criteriaOrMistakesIdx >= 0
      ? afterContract.slice(0, criteriaOrMistakesIdx).trim()
      : afterContract.split("\n")[0] || "";
  } else {
    summaryFeedback = value.split("\n")[0] || "";
  }

  return {
    source,
    mistakes,
    nextAction,
    strengths,
    areasToRefine,
    criteriaEvidence,
    summaryFeedback,
  };
}
