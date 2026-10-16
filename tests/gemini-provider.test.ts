import { describe, expect, it, vi, beforeEach } from "vitest";
import { GeminiEvaluationProvider, createConfiguredEvaluationProvider } from "@/src/server/evaluation/gemini-provider";
import { createEvaluationBoundary, serializeEvaluationFeedback } from "@/src/server/evaluation/boundary";
import type { EvaluationRequest } from "@/src/server/evaluation/contracts";

const request: EvaluationRequest = {
  scenarioPrompt: "Respond to a customer escalation regarding shipment delay.",
  expectedStructure: "State current status, give empathetic apology, and outline next action.",
  response: "We deeply apologize for the shipment delay. Our logistics team has rerouted your package and it will arrive tomorrow by 2 PM.",
};

const mockGeminiSuccessResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              schemaVersion: "speakql.evaluation.v1",
              score: "mastered",
              feedback: "Empathetic acknowledgment and clear resolution timeframe provided.",
              criteria: [
                { id: "context", label: "Context signal", passed: true, evidence: "Directly addressed shipment delay." },
                { id: "structure", label: "Clear structure", passed: true, evidence: "Well structured with apology and solution." },
                { id: "specificity", label: "Specific detail", passed: true, evidence: "Specified delivery time: tomorrow by 2 PM." },
              ],
              mistakes: [],
              nextAction: "Practice handling an escalation with an unexpected customs hold.",
              usage: {
                inputTokens: 120,
                outputTokens: 85,
                costUsd: 0.00003,
              },
            }),
          },
        ],
      },
    },
  ],
  usageMetadata: {
    promptTokenCount: 120,
    candidatesTokenCount: 85,
  },
};

describe("Gemini Evaluation Provider Adapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("checks availability safely and rejects evaluation without API key", async () => {
    const unconfigured = new GeminiEvaluationProvider({ apiKey: "" });
    expect(unconfigured.isAvailable()).toBe(false);

    const controller = new AbortController();
    await expect(unconfigured.evaluate(request, controller.signal)).rejects.toThrow("Gemini API key is not configured.");
  });

  it("formats prompt, calls endpoint, and returns validated schema when API key is present", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeminiSuccessResponse,
    } as Response);

    const provider = new GeminiEvaluationProvider({ apiKey: "test-fake-key" });
    expect(provider.isAvailable()).toBe(true);

    const controller = new AbortController();
    const result = (await provider.evaluate(request, controller.signal)) as { score: string; schemaVersion: string };

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [callUrl, callOptions] = fetchSpy.mock.calls[0];
    expect(String(callUrl)).toContain("key=test-fake-key");
    expect(callOptions?.method).toBe("POST");
    expect(callOptions?.body).toContain("speakql.evaluation.v1");
    expect(result.score).toBe("mastered");
    expect(result.schemaVersion).toBe("speakql.evaluation.v1");
  });

  it("plugs seamlessly into evaluation boundary and marks source as provider", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeminiSuccessResponse,
    } as Response);

    const provider = new GeminiEvaluationProvider({ apiKey: "test-fake-key" });
    const boundary = createEvaluationBoundary({ provider });
    const decision = await boundary.evaluate(request);

    expect(decision.source).toBe("provider");
    expect(decision.providerId).toBe("google-gemini");
    expect(decision.result.score).toBe("mastered");

    const serialized = serializeEvaluationFeedback(decision);
    expect(serialized).toContain("Evaluation source: configured provider (google-gemini)");
  });

  it("handles HTTP 429 rate limiting without crashing, triggering deterministic fallback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => "Resource exhausted: rate limit exceeded",
    } as Response);

    const provider = new GeminiEvaluationProvider({ apiKey: "test-fake-key" });
    const boundary = createEvaluationBoundary({ provider });
    const decision = await boundary.evaluate(request);

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("provider_error");
    expect(decision.result.schemaVersion).toBe("speakql.evaluation.v1");
    expect(serializeEvaluationFeedback(decision)).toContain("Evaluation source: deterministic fallback (non-AI)");
  });

  it("handles malformed JSON from provider without crashing, triggering invalid_provider_output fallback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: JSON.stringify({ broken: "unexpected shape" }) }] } }],
      }),
    } as Response);

    const provider = new GeminiEvaluationProvider({ apiKey: "test-fake-key" });
    const boundary = createEvaluationBoundary({ provider });
    const decision = await boundary.evaluate(request);

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("invalid_provider_output");
  });

  it("createConfiguredEvaluationProvider returns undefined when no environment key is present", () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const originalGoogle = process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    try {
      const provider = createConfiguredEvaluationProvider();
      expect(provider).toBeUndefined();
    } finally {
      if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
      if (originalGoogle) process.env.GOOGLE_API_KEY = originalGoogle;
    }
  });
});
