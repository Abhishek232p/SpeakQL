import { describe, expect, it, vi } from "vitest";
import { createEvaluationBoundary, serializeEvaluationFeedback } from "@/src/server/evaluation/boundary";
import type { EvaluationProvider, EvaluationRequest } from "@/src/server/evaluation/contracts";

const request: EvaluationRequest = {
  scenarioPrompt: "Respond to a customer escalation with context.",
  expectedStructure: "A professional response with a clear next step.",
  response: "I would acknowledge the concern, explain the trade-off, and give the customer a clear next step.",
};

const validOutput = {
  schemaVersion: "speakql.evaluation.v1",
  score: "mastered" as const,
  feedback: "The response is clear and gives a concrete next step.",
  criteria: [
    { id: "context" as const, label: "Context signal", passed: true, evidence: "The response addresses the escalation." },
    { id: "structure" as const, label: "Clear structure", passed: true, evidence: "The response has a clear sequence." },
    { id: "specificity" as const, label: "Specific detail", passed: true, evidence: "The response names a next step." },
  ],
  mistakes: [],
  nextAction: "Try the scenario with a tighter time constraint.",
  usage: { inputTokens: 40, outputTokens: 30, costUsd: 0.001 },
};

function provider(output: unknown): EvaluationProvider {
  return {
    id: "test-provider",
    evaluate: vi.fn(async () => output),
  };
}

describe("provider-neutral evaluation boundary", () => {
  it("accepts a valid structured provider result", async () => {
    const result = await createEvaluationBoundary({ provider: provider(validOutput) }).evaluate(request);

    expect(result).toEqual({
      source: "provider",
      providerId: "test-provider",
      result: validOutput,
    });
  });

  it("rejects malformed provider output and stores a labelled fallback instead", async () => {
    const malformed = { ...validOutput, unexpected: "do not persist this" };
    const result = await createEvaluationBoundary({ provider: provider(malformed) }).evaluate(request);

    expect(result.source).toBe("fallback");
    expect(result.fallbackReason).toBe("invalid_provider_output");
    expect(result.result.schemaVersion).toBe("speakql.evaluation.v1");
    expect(serializeEvaluationFeedback(result)).toContain("Evaluation source: deterministic fallback (non-AI).");
    expect(serializeEvaluationFeedback(result)).not.toContain("do not persist this");
  });

  it("uses the explicit non-AI fallback when no provider is configured", async () => {
    const result = await createEvaluationBoundary().evaluate(request);

    expect(result.source).toBe("fallback");
    expect(result.fallbackReason).toBe("no_provider_configured");
    expect(result.result.usage.costUsd).toBe(0);
    expect(serializeEvaluationFeedback(result)).toContain("no AI provider is configured");
  });

  it("falls back on provider errors without exposing the provider error", async () => {
    const failingProvider: EvaluationProvider = {
      id: "failing-provider",
      evaluate: vi.fn(async () => { throw new Error("secret provider diagnostic"); }),
    };
    const result = await createEvaluationBoundary({ provider: failingProvider }).evaluate(request);

    expect(result.fallbackReason).toBe("provider_error");
    expect(serializeEvaluationFeedback(result)).not.toContain("secret provider diagnostic");
  });

  it("aborts and falls back when the provider exceeds the timeout", async () => {
    let aborted = false;
    const slowProvider: EvaluationProvider = {
      id: "slow-provider",
      evaluate: vi.fn((_input, signal) => new Promise<never>(() => {
        signal.addEventListener("abort", () => { aborted = true; }, { once: true });
      })),
    };

    const result = await createEvaluationBoundary({
      provider: slowProvider,
      limits: { timeoutMs: 5 },
    }).evaluate(request);

    expect(result.fallbackReason).toBe("provider_timeout");
    expect(aborted).toBe(true);
  });

  it("does not call a provider when estimated input usage is over the limit", async () => {
    const configuredProvider = provider(validOutput);
    const result = await createEvaluationBoundary({
      provider: configuredProvider,
      limits: { maxInputTokens: 1 },
    }).evaluate(request);

    expect(result.fallbackReason).toBe("input_usage_limit");
    expect(configuredProvider.evaluate).not.toHaveBeenCalled();
  });

  it.each([
    { limit: { maxOutputTokens: 10 }, reason: "output_usage_limit" as const },
    { limit: { maxCostUsd: 0.0001 }, reason: "output_usage_limit" as const },
  ])("falls back when provider usage or cost exceeds the configured limit", async ({ limit, reason }) => {
    const result = await createEvaluationBoundary({
      provider: provider(validOutput),
      limits: limit,
    }).evaluate(request);

    expect(result.fallbackReason).toBe(reason);
    expect(result.source).toBe("fallback");
  });
});
