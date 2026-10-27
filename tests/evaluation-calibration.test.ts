import { describe, it, expect } from "vitest";
import { createEvaluationBoundary } from "@/src/server/evaluation/boundary";
import type { EvaluationProvider } from "@/src/server/evaluation/contracts";
import calibrationSet from "./fixtures/evaluation-calibration-set.json";

describe("Pedagogical Evaluation Calibration & Rubric Test Set", () => {
  it("loads the versioned calibration test set with all required categories", () => {
    expect(calibrationSet.version).toBe("1.2.0");
    expect(calibrationSet.items.length).toBe(15);

    const categories = calibrationSet.items.map((i) => i.category);
    expect(categories).toContain("clearly_successful");
    expect(categories).toContain("partially_successful");
    expect(categories).toContain("missing_information");
    expect(categories).toContain("grammatically_imperfect_understandable");
    expect(categories).toContain("off_topic");
    expect(categories).toContain("ambiguous");
    expect(categories).toContain("multilingual_non_latin");
    expect(categories).toContain("adversarial");
  });

  const boundary = createEvaluationBoundary({ provider: undefined });

  for (const item of calibrationSet.items) {
    it(`evaluates ${item.id} (${item.category}) with expected rubric criteria`, async () => {
      const decision = await boundary.evaluate(item.request);

      expect(decision.source).toBe("fallback");
      const result = decision.result;
      expect(result.schemaVersion).toBe("speakql.evaluation.v1");
      expect(result.score).toBe(item.expected.score);

      const criteriaMap = Object.fromEntries(
        result.criteria.map((c) => [c.id, c.passed])
      );

      // Verify each criterion matches expected outcome
      if (item.expected.criteria.context !== undefined) {
        expect(criteriaMap.context).toBe(item.expected.criteria.context);
      }
      if (item.expected.criteria.structure !== undefined) {
        expect(criteriaMap.structure).toBe(item.expected.criteria.structure);
      }
      if (item.expected.criteria.specificity !== undefined) {
        expect(criteriaMap.specificity).toBe(item.expected.criteria.specificity);
      }

      // Mastery policy check: if any criterion failed, score MUST be needs_work
      const allPassed = result.criteria.every((c) => c.passed);
      if (allPassed) {
        expect(result.score).toBe("mastered");
        expect(result.mistakes.length).toBe(0);
      } else {
        expect(result.score).toBe("needs_work");
        expect(result.mistakes.length).toBeGreaterThan(0);
      }
    });
  }

  it("yields identical, deterministic evaluation results on repeated submissions", async () => {
    const item = calibrationSet.items[0];
    const decision1 = await boundary.evaluate(item.request);
    const decision2 = await boundary.evaluate(item.request);

    expect(decision1.result.score).toBe(decision2.result.score);
    expect(decision1.result.feedback).toBe(decision2.result.feedback);
    expect(decision1.result.criteria).toEqual(decision2.result.criteria);
  });

  it("handles provider timeouts safely by gracefully falling back to deterministic evaluation", async () => {
    const slowProvider: EvaluationProvider = {
      id: "slow-provider",
      async evaluate(_request, signal) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 500);
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new Error("aborted"));
          });
        });
        throw new Error("unreachable");
      },
    };

    const timeoutBoundary = createEvaluationBoundary({
      provider: slowProvider,
      limits: { timeoutMs: 50 },
    });

    const decision = await timeoutBoundary.evaluate({
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: "Ayer terminé el diseño de la base de datos.",
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("provider_timeout");
    expect(decision.result.score).toBeDefined();
  });

  it("handles HTTP 429 rate limit or 5xx provider errors by falling back with provider_error", async () => {
    const errorProvider: EvaluationProvider = {
      id: "rate-limited-provider",
      async evaluate() {
        throw new Error("HTTP 429: Resource has been exhausted (rate limit exceeded).");
      },
    };

    const errorBoundary = createEvaluationBoundary({ provider: errorProvider });

    const decision = await errorBoundary.evaluate({
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: "Ayer terminé el diseño de la base de datos.",
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("provider_error");
    expect(decision.result.score).toBeDefined();
  });

  it("handles malformed JSON or invalid schema from provider by falling back with invalid_provider_output", async () => {
    const invalidOutputProvider: EvaluationProvider = {
      id: "broken-provider",
      async evaluate() {
        return {
          not_a_valid_evaluation_result: true,
          randomField: 12345,
        };
      },
    };

    const invalidBoundary = createEvaluationBoundary({ provider: invalidOutputProvider });

    const decision = await invalidBoundary.evaluate({
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: "Ayer terminé el diseño de la base de datos.",
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("invalid_provider_output");
  });

  it("handles missing rubric criteria from provider output by failing schema validation and falling back", async () => {
    const missingCriteriaProvider: EvaluationProvider = {
      id: "missing-criteria-provider",
      async evaluate() {
        return {
          schemaVersion: "speakql.evaluation.v1",
          score: "mastered",
          feedback: "Great!",
          criteria: [], // Missing required criteria elements (< min(1))
          mistakes: [],
          nextAction: "Next",
          usage: { inputTokens: 10, outputTokens: 5, costUsd: 0 },
        };
      },
    };

    const missingBoundary = createEvaluationBoundary({ provider: missingCriteriaProvider });

    const decision = await missingBoundary.evaluate({
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: "Ayer terminé el diseño de la base de datos.",
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("invalid_provider_output");
  });

  it("handles malformed criteria elements by falling back to deterministic evaluation", async () => {
    const malformedCriteriaProvider: EvaluationProvider = {
      id: "malformed-criteria-provider",
      async evaluate() {
        return {
          schemaVersion: "speakql.evaluation.v1",
          score: "mastered",
          feedback: "Great!",
          criteria: [{ invalid_field: "foo" }], // Malformed
          mistakes: [],
          nextAction: "Next",
          usage: { inputTokens: 10, outputTokens: 5, costUsd: 0 },
        };
      },
    };

    const malformedBoundary = createEvaluationBoundary({ provider: malformedCriteriaProvider });

    const decision = await malformedBoundary.evaluate({
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: "Ayer terminé el diseño de la base de datos.",
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("invalid_provider_output");
  });

  it("handles requests with individual fields exceeding schema limits with invalid_request", async () => {
    const hugeResponse = "palabra ".repeat(3000); // ~24,000 chars, exceeds 10,000 char limit

    const decision = await boundary.evaluate({
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: hugeResponse,
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("invalid_request");
  });

  it("handles combined requests exceeding aggregate input limits with input_usage_limit", async () => {
    // Each individual field passes schema limits (<= 2000, <= 2000, <= 10000)
    // but aggregate inputChars > 10,000
    const scenarioPrompt = "escenario ".repeat(180); // ~1,800 chars
    const expectedStructure = "estructura ".repeat(170); // ~1,870 chars
    const response = "respuesta de prueba con detalle ".repeat(250); // ~8,000 chars

    const decision = await boundary.evaluate({
      scenarioPrompt,
      expectedStructure,
      response,
    });

    expect(decision.source).toBe("fallback");
    expect(decision.fallbackReason).toBe("input_usage_limit");
  });

  it("prevents an LLM provider from assigning arbitrary mastery values without meeting criteria", async () => {
    // Construct a mock provider that attempts to return an arbitrary score of 'mastered' while failing specificity
    const rogueProvider: EvaluationProvider = {
      id: "rogue-provider",
      async evaluate() {
        return {
          schemaVersion: "speakql.evaluation.v1",
          score: "mastered", // Attempting to bypass criteria
          feedback: "Great job! (arbitrary)",
          criteria: [
            { id: "context", label: "Context", passed: true, evidence: "Ok" },
            { id: "structure", label: "Structure", passed: true, evidence: "Ok" },
            { id: "specificity", label: "Specificity", passed: false, evidence: "Missing detail" }, // Failed!
          ],
          mistakes: ["Specificity needs work"],
          nextAction: "Try again",
          usage: { inputTokens: 50, outputTokens: 20, costUsd: 0 },
        };
      },
    };

    const rogueBoundary = createEvaluationBoundary({ provider: rogueProvider });
    const request = {
      scenarioPrompt: "Daily standup",
      expectedStructure: "Yesterday, today, blockers",
      response: "Short.",
    };

    const decision = await rogueBoundary.evaluate(request);

    // The boundary enforces that score MUST be 'needs_work' if any criterion failed!
    expect(decision.result.score).toBe("needs_work");
  });
});
